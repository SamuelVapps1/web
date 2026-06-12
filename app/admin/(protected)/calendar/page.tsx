export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Plus } from 'lucide-react';
import styles from '../../admin.module.css';
import { getBratislavaDateKey } from '@/lib/time';
import { OPENING_HOURS, buildWorkingDaySlots } from '@/lib/opening-hours.js';
import { getAdminManualReservationContext, listAdminCalendarRange } from '@/lib/admin-data';
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

function getSlotHref(baseHref: string, dateKey: string, timeKey: string): string {
  return `${baseHref}&reservationDate=${dateKey}&reservationTime=${timeKey}`;
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
  const view = params.view === 'month' ? 'month' : 'week';
  const anchorDate = params.date ?? getBratislavaDateKey();
  const data = await listAdminCalendarRange(anchorDate, view);
  const dayParam =
    params.day && data.days.some((day) => day.dateKey === params.day)
      ? params.day
      : data.days.find((day) => day.isCurrentMonth)?.dateKey ?? data.days[0]?.dateKey ?? anchorDate;
  const selectedDay = data.days.find((day) => day.dateKey === dayParam) ?? data.days[0] ?? null;
  const reservationDate = params.reservationDate ?? '';
  const reservationTime = params.reservationTime ?? '';
  const showReservationModal = Boolean(reservationDate && reservationTime);
  const reservationContext = showReservationModal ? await getAdminManualReservationContext() : null;
  const closeHref = `/admin/calendar?date=${anchorDate}&view=${view}${dayParam ? `&day=${dayParam}` : ''}`;
  const baseReservationHref = `/admin/calendar?date=${anchorDate}&view=${view}${dayParam ? `&day=${dayParam}` : ''}`;
  const historyReservations = data.days.flatMap((day) => day.history).slice(0, 12);
  const todayHref = `/admin/calendar?date=${getBratislavaDateKey()}&view=${view}`;
  const weekBoardDays = data.days.slice(0, 5);
  const openingHoursLabel = `${OPENING_HOURS.dayStart} – ${OPENING_HOURS.lunchBreak.start} · ${OPENING_HOURS.lunchBreak.end} – ${OPENING_HOURS.dayEnd}`;

  return (
    <div className={styles.calendarPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Kalendár</p>
          <h1 className={styles.pageTitle}>{data.titleLabel}</h1>
          <p className={styles.pageLead}>{data.rangeLabel}</p>
        </div>
        <div className={styles.calendarHeaderActions}>
          <ViewButton active={view === 'week'} href={`/admin/calendar?date=${anchorDate}&view=week`}>
            Týždeň
          </ViewButton>
          <ViewButton active={view === 'month'} href={`/admin/calendar?date=${anchorDate}&view=month`}>
            Mesiac
          </ViewButton>
          <Link className="btn btn--ghost" href={todayHref}>
            Dnes
          </Link>
          <Link
            className="btn btn--primary"
            href={getSlotHref(baseReservationHref, selectedDay?.dateKey ?? anchorDate, '10:00')}
          >
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            Nová rezervácia
          </Link>
        </div>
      </section>

      <div className={styles.calendarRangeNav}>
        <Link className="btn btn--ghost" href={`/admin/calendar?date=${data.previousDateKey}&view=${view}`}>
          Predchádzajúce obdobie
        </Link>
        <Link className="btn btn--ghost" href={`/admin/calendar?date=${data.nextDateKey}&view=${view}`}>
          Ďalšie obdobie
        </Link>
      </div>

      {view === 'week' ? (
        <section className={styles.calendarBoard}>
          <div className={styles.calendarBoardHeader}>
            <div className={styles.calendarBoardCorner}>
              <p className={styles.sectionKicker}>Týždeň</p>
              <h2>{data.rangeLabel}</h2>
              <p className={styles.sectionSubcopy}>Otvorené {openingHoursLabel}</p>
            </div>

            {weekBoardDays.map((day) => {
              const dayReservations = getDayReservations(day);
              return (
                <article key={day.dateKey} className={styles.calendarBoardDayHead}>
                  <div>
                    <strong>{day.label}</strong>
                    <span>{dayReservations.length} položiek</span>
                  </div>
                  <Link
                    className="btn btn--ghost"
                    href={getSlotHref(baseReservationHref, day.dateKey, '10:00')}
                  >
                    + Rezervácia
                  </Link>
                </article>
              );
            })}
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

            {weekBoardDays.map((day) => {
              const dayReservations = getDayReservations(day);
              const laidOutReservations = layoutReservations(dayReservations);

              return (
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
                    const isBusy = laidOutReservations.some(
                      (reservation) => reservation.startMin < slotEnd && reservation.endMin > slotStart,
                    );

                    if (isBusy) {
                      return null;
                    }

                    return (
                      <Link
                        key={`${day.dateKey}-${slot}`}
                        className={styles.calendarSlotLink}
                        href={getSlotHref(baseReservationHref, day.dateKey, slot)}
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
              );
            })}
          </div>
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
                  <Link className="btn btn--ghost" href={getSlotHref(baseReservationHref, day.dateKey, '10:00')}>
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
                    <span className={styles.calendarMonthCellMore}>
                      +{dayReservations.length - 3} ďalších
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>História</p>
        <div className={styles.historyList}>
          {historyReservations.length > 0 ? (
            historyReservations.map((reservation) => (
              <Link key={reservation.id} className={styles.historyCard} href={`/admin/reservations/${reservation.id}`}>
                <strong>{reservation.startLabel}</strong>
                <span>
                  {reservation.customerName} / {reservation.dogName}
                </span>
                <span>
                  {reservation.statusLabel} · {reservation.cutTypeLabel}
                </span>
              </Link>
            ))
          ) : (
            <p className={styles.emptyState}>V tomto období nie je žiadna história.</p>
          )}
        </div>
      </section>

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
