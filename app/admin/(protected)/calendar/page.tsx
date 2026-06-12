export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Plus,
} from 'lucide-react';
import styles from '../../admin.module.css';
import { getBratislavaDateKey } from '@/lib/time';
import { ADMIN_TIME_WINDOW, buildWorkingDaySlots } from '@/lib/admin-schedule.js';
import { getAdminManualReservationContext, listAdminCalendarRange } from '@/lib/admin-data';
import CalendarReservationModal from './calendar-reservation-modal';

function hourLabel(time: string) {
  return time;
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

function getEventTone(status: string) {
  if (status === 'CONFIRMED') {
    return styles.calendarEventConfirmed;
  }

  if (status === 'PENDING') {
    return styles.calendarEventPending;
  }

  return styles.calendarEventHistory;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; day?: string; view?: string; reservationDate?: string; reservationTime?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const view = params.view === 'month' ? 'month' : 'week';
  const anchorDate = params.date ?? getBratislavaDateKey();
  const reservationDate = params.reservationDate ?? '';
  const reservationTime = params.reservationTime ?? '';
  const showReservationModal = Boolean(reservationDate && reservationTime);
  const data = await listAdminCalendarRange(anchorDate, view);
  const reservationContext = showReservationModal ? await getAdminManualReservationContext() : null;
  const dayParam =
    params.day && data.days.some((day) => day.dateKey === params.day)
      ? params.day
      : data.days.find((day) => day.isCurrentMonth)?.dateKey ?? data.days[0]?.dateKey;
  const selectedDay = data.days.find((day) => day.dateKey === dayParam) ?? data.days[0];
  const slots = buildWorkingDaySlots();
  const slotIndex = new Map(slots.map((slot, index) => [slot, index] as const));
  const historyReservations = data.days.flatMap((day) => day.history).slice(0, 12);
  const closeHref = `/admin/calendar?date=${anchorDate}&view=${view}${dayParam ? `&day=${dayParam}` : ''}`;
  const baseReservationHref = `/admin/calendar?date=${anchorDate}&view=${view}${selectedDay ? `&day=${selectedDay.dateKey}` : ''}`;

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
          <Link className="btn btn--ghost" href={`/admin/calendar?date=${getBratislavaDateKey()}&view=${view}`}>
            Dnes
          </Link>
          <Link
            className="btn btn--primary"
            href={`${baseReservationHref}&reservationDate=${selectedDay?.dateKey ?? anchorDate}&reservationTime=10:00`}
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
            </div>

            {data.days.map((day) => (
              <article key={day.dateKey} className={styles.calendarBoardDayHead}>
                <div>
                  <strong>{day.label}</strong>
                  <span>{day.reservations.length + day.pending.length + day.history.length} položiek</span>
                </div>
                <Link className="btn btn--ghost" href={`${baseReservationHref}&reservationDate=${day.dateKey}&reservationTime=10:00`}>
                  + Rezervácia
                </Link>
              </article>
            ))}
          </div>

          <div className={styles.calendarBoardBody}>
            <div className={styles.calendarTimeRail} aria-hidden="true">
              {slots.map((slot) => (
                <div key={slot} className={styles.calendarTimeRailRow}>
                  <span>{hourLabel(slot)}</span>
                </div>
              ))}
              <div className={styles.calendarTimeRailLunch}>Obed 13:00 - 14:00</div>
            </div>

            {data.days.map((day) => {
              const events = [...day.reservations, ...day.pending, ...day.history];

              return (
                <div key={day.dateKey} className={styles.calendarBoardDayColumn}>
                  {events.map((reservation) => {
                    const startIndex = slotIndex.get(reservation.timeLabel) ?? 0;
                    const rowSpan = Math.max(1, Math.ceil(reservation.durationMin / 30));

                    return (
                      <Link
                        key={reservation.id}
                        className={`${styles.calendarEventBlock} ${getEventTone(reservation.status)}`}
                        style={{ gridRow: `${startIndex + 1} / span ${rowSpan}` }}
                        href={`/admin/reservations/${reservation.id}`}
                      >
                        <strong>{reservation.timeLabel}</strong>
                        <span>{reservation.dogName}</span>
                        <small>
                          {reservation.cutTypeLabel} · {reservation.durationMin} min
                        </small>
                      </Link>
                    );
                  })}

                  <Link
                    className={styles.calendarEmptySlot}
                    href={`${baseReservationHref}&reservationDate=${day.dateKey}&reservationTime=10:00`}
                    aria-label={`Pridať rezerváciu pre ${day.label}`}
                  >
                    <span>+</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className={styles.calendarMonthGrid}>
          {data.days.map((day) => (
            <article
              key={day.dateKey}
              className={`${styles.calendarMonthCell} ${day.isCurrentMonth ? '' : styles.calendarMonthCellMuted}`}
            >
              <div className={styles.calendarMonthCellHeader}>
                <div>
                  <strong>{day.label}</strong>
                  <span>{day.reservations.length + day.pending.length + day.history.length} položiek</span>
                </div>
                <Link className="btn btn--ghost" href={`${baseReservationHref}&reservationDate=${day.dateKey}&reservationTime=10:00`}>
                  +
                </Link>
              </div>
              <div className={styles.calendarMonthCellList}>
                {[...day.reservations, ...day.pending, ...day.history].slice(0, 3).map((reservation) => (
                  <Link key={reservation.id} className={styles.calendarMonthCellItem} href={`/admin/reservations/${reservation.id}`}>
                    <strong>{reservation.timeLabel}</strong>
                    <span>{reservation.dogName}</span>
                  </Link>
                ))}
                {[...day.reservations, ...day.pending, ...day.history].length > 3 ? (
                  <span className={styles.calendarMonthCellMore}>
                    +{[...day.reservations, ...day.pending, ...day.history].length - 3} ďalších
                  </span>
                ) : null}
              </div>
            </article>
          ))}
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
