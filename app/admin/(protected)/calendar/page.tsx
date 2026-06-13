export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Plus } from 'lucide-react';
import styles from '../../admin.module.css';
import { getBratislavaDateKey } from '@/lib/time';
import { getAdminManualReservationContext, listAdminCalendarRange } from '@/lib/admin-data';
import { OPENING_HOURS, buildWorkingDaySlots } from '@/lib/opening-hours.js';
import CalendarReservationModal from './calendar-reservation-modal';

const ROW_HEIGHT = 54;
const DAY_START_MINUTES = 10 * 60;
const LUNCH_START_MINUTES = 13 * 60;
const LUNCH_END_MINUTES = 14 * 60;
const WORKING_SLOTS = buildWorkingDaySlots();
const BOARD_ROWS = [...WORKING_SLOTS.slice(0, 6), 'LUNCH', ...WORKING_SLOTS.slice(6)];

type CalendarData = Awaited<ReturnType<typeof listAdminCalendarRange>>;
type CalendarDay = CalendarData['days'][number];
type CalendarReservation = CalendarDay['reservations'][number];

type PositionedReservation = CalendarReservation & {
  startMin: number;
  endMin: number;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
};

function timeKeyToMinutes(timeKey: string): number {
  const [hour, minute] = timeKey.split(':').map(Number);
  return hour * 60 + minute;
}

function getCompressedMinutes(timeKey: string): number {
  const minutes = timeKeyToMinutes(timeKey);

  if (minutes <= LUNCH_START_MINUTES) {
    return minutes - DAY_START_MINUTES;
  }

  if (minutes >= LUNCH_END_MINUTES) {
    return minutes - DAY_START_MINUTES - (LUNCH_END_MINUTES - LUNCH_START_MINUTES);
  }

  return LUNCH_START_MINUTES - DAY_START_MINUTES;
}

function getRowIndex(timeKey: string): number {
  const index = WORKING_SLOTS.indexOf(timeKey);
  return index < 6 ? index + 1 : index + 2;
}

function getEventTone(status: string): string {
  if (status === 'CONFIRMED') {
    return styles.calendarEventConfirmed;
  }

  if (status === 'PENDING') {
    return styles.calendarEventPending;
  }

  return styles.calendarEventHistory;
}

function buildCalendarHref(dateKey: string, view: 'day' | 'week' | 'month', dayKey?: string): string {
  const params = new URLSearchParams({ date: dateKey, view });

  if (dayKey) {
    params.set('day', dayKey);
  }

  return `/admin/calendar?${params.toString()}`;
}

function buildReservationHref(dateKey: string, dayKey: string, timeKey: string): string {
  const params = new URLSearchParams({
    date: dateKey,
    view: 'day',
    day: dayKey,
    reservationDate: dayKey,
    reservationTime: timeKey,
  });

  return `/admin/calendar?${params.toString()}`;
}

function getDayReservations(day: CalendarDay): CalendarReservation[] {
  return [...day.reservations, ...day.pending, ...day.history].sort(
    (left, right) => timeKeyToMinutes(left.timeLabel) - timeKeyToMinutes(right.timeLabel),
  );
}

function layoutReservations(reservations: CalendarReservation[]): PositionedReservation[] {
  type ClusterEvent = CalendarReservation & {
    startMin: number;
    endMin: number;
  };

  const sorted: ClusterEvent[] = reservations
    .map((reservation) => {
      const startMin = timeKeyToMinutes(reservation.timeLabel);
      return {
        ...reservation,
        startMin,
        endMin: startMin + reservation.durationMin,
      };
    })
    .sort((left, right) => left.startMin - right.startMin || left.endMin - right.endMin);

  const output: PositionedReservation[] = [];
  let cluster: ClusterEvent[] = [];
  let clusterEnd = -1;

  function flushCluster() {
    if (cluster.length === 0) {
      return;
    }

    const laneEnds: number[] = [];
    const laidOut = cluster.map((event) => {
      let lane = laneEnds.findIndex((end) => end <= event.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
      }

      laneEnds[lane] = event.endMin;
      return {
        ...event,
        lane,
      };
    });

    const laneCount = Math.max(1, laneEnds.length);

    for (const event of laidOut) {
      const startOffset = getCompressedMinutes(event.timeLabel);
      const endOffset = getCompressedMinutes(event.endLabel);
      output.push({
        ...event,
        top: (startOffset / OPENING_HOURS.slotStepMinutes) * ROW_HEIGHT,
        height: Math.max(
          ROW_HEIGHT * 0.9,
          ((Math.max(endOffset, startOffset + OPENING_HOURS.slotStepMinutes) - startOffset) /
            OPENING_HOURS.slotStepMinutes) *
            ROW_HEIGHT,
        ),
        laneCount,
      });
    }

    cluster = [];
    clusterEnd = -1;
  }

  for (const event of sorted) {
    if (cluster.length === 0) {
      cluster.push(event);
      clusterEnd = event.endMin;
      continue;
    }

    if (event.startMin < clusterEnd) {
      cluster.push(event);
      clusterEnd = Math.max(clusterEnd, event.endMin);
      continue;
    }

    flushCluster();
    cluster.push(event);
    clusterEnd = event.endMin;
  }

  flushCluster();
  return output;
}

function ViewButton({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className={`btn ${active ? 'btn--primary' : 'btn--ghost'}`} href={href}>
      {children}
    </Link>
  );
}

function DaySummaryCard({
  day,
}: {
  day: CalendarDay;
}) {
  const total = day.reservations.length + day.pending.length + day.history.length;
  const pendingHref = buildReservationHref(day.dateKey, day.dateKey, '10:00');

  return (
    <article className={styles.calendarDaySummaryCard}>
      <div className={styles.calendarDaySummaryTop}>
        <div>
          <Link className={styles.calendarDaySummaryTitle} href={buildCalendarHref(day.dateKey, 'day', day.dateKey)}>
            {day.label}
          </Link>
          <p className={styles.calendarDaySummaryMeta}>
            {total} termínov · {day.reservations.length} potvrdených · {day.pending.length} čakajúcich
          </p>
        </div>

        <div className={styles.calendarDaySummaryActions}>
          <Link className="btn btn--ghost" href={buildCalendarHref(day.dateKey, 'day', day.dateKey)}>
            Otvoriť deň
          </Link>
          <Link className="btn btn--primary" href={pendingHref}>
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            Pridať termín
          </Link>
        </div>
      </div>

      <div className={styles.calendarDaySummaryCounts}>
        <span>Potvrdené {day.reservations.length}</span>
        <span>Čakajúce {day.pending.length}</span>
        <span>História {day.history.length}</span>
      </div>
    </article>
  );
}

function DayBoard({
  day,
  anchorDate,
}: {
  day: CalendarDay;
  anchorDate: string;
}) {
  const dayReservations = getDayReservations(day);
  const laidOutReservations = layoutReservations(dayReservations);

  return (
    <section className={`${styles.calendarBoard} ${styles.calendarDayBoard}`}>
      <div className={styles.calendarBoardHeader}>
        <div className={styles.calendarBoardCorner}>
          <p className={styles.sectionKicker}>Deň</p>
          <h2>{day.label}</h2>
          <p className={styles.sectionSubcopy}>
            {day.reservations.length} potvrdených · {day.pending.length} čakajúcich
          </p>
        </div>

        <article className={styles.calendarBoardDayHead}>
          <div>
            <strong>{day.label}</strong>
            <span>{dayReservations.length} položiek</span>
          </div>
          <Link className="btn btn--primary" href={buildReservationHref(anchorDate, day.dateKey, '10:00')}>
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            Pridať termín
          </Link>
        </article>
      </div>

      <div className={styles.calendarBoardBody}>
        <div className={styles.calendarTimeRail} aria-hidden="true">
          {BOARD_ROWS.map((row) =>
            row === 'LUNCH' ? (
              <div key={row} className={styles.calendarTimeRailLunch}>
                Obed 13:00 – 14:00
              </div>
            ) : (
              <div key={row} className={styles.calendarTimeRailRow}>
                <span>{row}</span>
              </div>
            ),
          )}
        </div>

        <div key={day.dateKey} className={styles.calendarBoardDayColumn}>
          <div
            className={styles.calendarLunchBand}
            style={
              {
                top: `${ROW_HEIGHT * 6 + 7}px`,
                height: `${ROW_HEIGHT - 14}px`,
              } as CSSProperties
            }
          >
            Obed 13:00 – 14:00
          </div>

          {WORKING_SLOTS.map((slot) => {
            const slotStart = timeKeyToMinutes(slot);
            const slotEnd = slotStart + OPENING_HOURS.slotStepMinutes;
            const isBusy = laidOutReservations.some((reservation) => reservation.startMin < slotEnd && reservation.endMin > slotStart);

            if (isBusy) {
              return null;
            }

            return (
              <Link
                key={`${day.dateKey}-${slot}`}
                className={styles.calendarSlotLink}
                href={buildReservationHref(anchorDate, day.dateKey, slot)}
                aria-label={`Pridať rezerváciu na ${day.label} o ${slot}`}
                style={
                  {
                    top: `${(getRowIndex(slot) - 1) * ROW_HEIGHT + 4}px`,
                    height: `${ROW_HEIGHT - 8}px`,
                  } as CSSProperties
                }
              >
                + Rezervácia
              </Link>
            );
          })}

          {laidOutReservations.map((reservation) => {
            const laneWidth = 100 / reservation.laneCount;
            const laneOffset = reservation.lane * laneWidth;

            return (
              <Link
                key={reservation.id}
                className={`${styles.calendarEventBlock} ${getEventTone(reservation.status)}`}
                href={`/admin/reservations/${reservation.id}`}
                style={
                  {
                    top: `${reservation.top + 4}px`,
                    height: `${Math.max(44, reservation.height - 8)}px`,
                    left: `calc(${laneOffset}% + 0.25rem)`,
                    width: `calc(${laneWidth}% - 0.4rem)`,
                  } as CSSProperties
                }
              >
                <strong>{reservation.timeLabel}</strong>
                <span>{reservation.dogName}</span>
                <small>
                  {reservation.customerName} · {reservation.cutTypeLabel}
                </small>
                <small>
                  {reservation.statusLabel} · {reservation.durationMin} min
                </small>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{
    date?: string;
    day?: string;
    view?: string;
    reservationDate?: string;
    reservationTime?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const view = params.view === 'month' || params.view === 'day' ? params.view : 'week';
  const anchorDate = params.date ?? getBratislavaDateKey();
  const activeDateKey = view === 'day' ? (params.day ?? anchorDate) : anchorDate;
  const data = await listAdminCalendarRange(activeDateKey, view);
  const effectiveDay = data.days.find((day) => day.dateKey === activeDateKey) ?? data.days[0] ?? null;
  const reservationDate = params.reservationDate ?? '';
  const reservationTime = params.reservationTime ?? '';
  const showReservationModal = Boolean(reservationDate && reservationTime);
  const reservationContext = showReservationModal ? await getAdminManualReservationContext() : null;
  const closeHref = buildCalendarHref(activeDateKey, view, view === 'day' ? activeDateKey : effectiveDay?.dateKey);
  const todayKey = getBratislavaDateKey();
  const todayHref = buildCalendarHref(todayKey, 'day', todayKey);

  return (
    <div className={styles.calendarPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Kalendár</p>
          <h1 className={styles.pageTitle}>{data.titleLabel}</h1>
          <p className={styles.pageLead}>
            {view === 'day' ? 'Denný prehľad s voľnými a obsadenými slotmi.' : data.rangeLabel}
          </p>
        </div>
        <div className={styles.calendarHeaderActions}>
          <ViewButton active={view === 'day' && activeDateKey === todayKey} href={todayHref}>
            Dnes
          </ViewButton>
          <ViewButton active={view === 'week'} href={buildCalendarHref(anchorDate, 'week')}>
            Týždeň
          </ViewButton>
          <ViewButton active={view === 'month'} href={buildCalendarHref(anchorDate, 'month')}>
            Mesiac
          </ViewButton>
        </div>
      </section>

      <div className={styles.calendarRangeNav}>
        <Link className="btn btn--ghost" href={buildCalendarHref(data.previousDateKey, view, effectiveDay?.dateKey)}>
          Predchádzajúce obdobie
        </Link>
        <Link className="btn btn--ghost" href={buildCalendarHref(data.nextDateKey, view, effectiveDay?.dateKey)}>
          Ďalšie obdobie
        </Link>
        <Link className="btn btn--ghost" href={todayHref}>
          Dnes
        </Link>
      </div>

      {view === 'day' && effectiveDay ? (
        <DayBoard day={effectiveDay} anchorDate={activeDateKey} />
      ) : view === 'week' ? (
        <section className={styles.calendarDayList}>
          {data.days.map((day) => (
            <DaySummaryCard key={day.dateKey} day={day} />
          ))}
        </section>
      ) : (
        <section className={styles.calendarMonthGrid}>
          {data.days.map((day) => {
            const dayReservations = getDayReservations(day);

            return (
              <article
                key={day.dateKey}
                className={`${styles.calendarMonthCell} ${day.isCurrentMonth ? '' : styles.calendarMonthCellMuted}`}
              >
                <div className={styles.calendarMonthCellHeader}>
                  <div>
                    <strong>{day.label}</strong>
                    <span>{dayReservations.length} položiek</span>
                  </div>
                  <Link className="btn btn--ghost" href={buildReservationHref(day.dateKey, day.dateKey, '10:00')}>
                    +
                  </Link>
                </div>
                <div className={styles.calendarMonthCellList}>
                  {dayReservations.slice(0, 3).map((reservation) => (
                    <Link
                      key={reservation.id}
                      className={styles.calendarMonthCellItem}
                      href={`/admin/reservations/${reservation.id}`}
                    >
                      <strong>{reservation.timeLabel}</strong>
                      <span>{reservation.dogName}</span>
                    </Link>
                  ))}
                  {dayReservations.length > 3 ? (
                    <span className={styles.calendarMonthCellMore}>+{dayReservations.length - 3} ďalších</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {showReservationModal && reservationContext ? (
        <CalendarReservationModal
          closeHref={closeHref}
          customers={reservationContext.customers}
          availabilityReservations={reservationContext.availabilityReservations}
          initialDate={reservationDate}
          initialTime={reservationTime}
        />
      ) : null}
    </div>
  );
}
