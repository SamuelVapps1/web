export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../admin.module.css';
import { addDaysToDateKey, formatBratislavaDate, getBratislavaDateKey, localDateTimeToUtc } from '@/lib/time';
import { listAdminCalendarWeek } from '@/lib/admin-data';
import { ADMIN_TIME_WINDOW, buildWorkingDaySlots } from '@/lib/admin-schedule.js';

function getAnchor(searchParams?: { date?: string }) {
  return searchParams?.date ?? getBratislavaDateKey();
}

function hourLabel(time: string) {
  return time;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; day?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const anchorDate = getAnchor(params);
  const data = await listAdminCalendarWeek(anchorDate);
  const dayParam = params.day && data.days.some((day) => day.dateKey === params.day) ? params.day : data.days[0]?.dateKey;
  const selectedDay = data.days.find((day) => day.dateKey === dayParam) ?? data.days[0];
  const slots = buildWorkingDaySlots();

  return (
    <div className={styles.calendarPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Kalendár</p>
          <h1 className={styles.pageTitle}>{formatBratislavaDate(localDateTimeToUtc(anchorDate, '12:00'))}</h1>
          <p className={styles.pageLead}>
            Po - Pia. Obedná prestávka je sivý pás.
          </p>
        </div>
        <div className={styles.calendarHeaderActions}>
          <Link className="btn btn--ghost" href={`/admin/calendar?date=${getBratislavaDateKey()}`}>
            Dnes
          </Link>
          <Link className="btn btn--primary" href="/admin/reservations/new">
            + Nová rezervácia
          </Link>
        </div>
      </section>

      <nav className={styles.calendarDaysNav} aria-label="Dni v týždni">
        {data.days.map((day) => (
          <Link key={day.dateKey} className={`${styles.calendarDayNav} ${selectedDay?.dateKey === day.dateKey ? styles.calendarDayNavActive : ''}`} href={`/admin/calendar?date=${anchorDate}&day=${day.dateKey}`}>
            {day.label}
          </Link>
        ))}
      </nav>

      <section className={styles.calendarMobilePanel}>
        <div className={styles.calendarMobileHeader}>
          <h2>{selectedDay?.label}</h2>
          <div className={styles.calendarMobileNav}>
            <Link className="btn btn--ghost" href={`/admin/calendar?date=${anchorDate}&day=${addDaysToDateKey(selectedDay?.dateKey ?? anchorDate, -1)}`}>
              Predchádzajúci deň
            </Link>
            <Link className="btn btn--ghost" href={`/admin/calendar?date=${anchorDate}&day=${addDaysToDateKey(selectedDay?.dateKey ?? anchorDate, 1)}`}>
              Ďalší deň
            </Link>
          </div>
        </div>

        <div className={styles.dayTimeline}>
          {slots.map((slot) => {
            const dayReservations = [...(selectedDay?.reservations ?? []), ...(selectedDay?.pending ?? [])];
            const slotMinutes = parseInt(slot.split(':')[0], 10) * 60 + parseInt(slot.split(':')[1], 10);
            const slotReservation = dayReservations.find((reservation) => {
              const startMinutes = parseInt(reservation.timeLabel.split(':')[0], 10) * 60 + parseInt(reservation.timeLabel.split(':')[1], 10);
              const endMinutes = startMinutes + reservation.durationMin;
              return slotMinutes >= startMinutes && slotMinutes < endMinutes;
            });
            const reservationStartMinutes = slotReservation
              ? parseInt(slotReservation.timeLabel.split(':')[0], 10) * 60 + parseInt(slotReservation.timeLabel.split(':')[1], 10)
              : 0;
            const isReservationStart = slotReservation
              ? slotMinutes <= reservationStartMinutes && reservationStartMinutes < slotMinutes + 30
              : false;
            const isLunch = slot >= ADMIN_TIME_WINDOW.lunchStart && slot < ADMIN_TIME_WINDOW.lunchEnd;
            return (
              <div key={slot} className={`${styles.timelineSlot} ${isLunch ? styles.timelineLunch : ''}`}>
                <span className={styles.timelineTime}>{hourLabel(slot)}</span>
                {isReservationStart ? (
                  <Link
                    className={`${styles.timelineCard} ${slotReservation.status === 'PENDING' ? styles.timelineCardPending : ''}`}
                    style={{ minHeight: `${Math.max(1, slotReservation.durationMin / 30) * 52}px` }}
                    href={`/admin/reservations/${slotReservation.id}`}
                  >
                    <strong>{slotReservation.dogName}</strong>
                    <span>{slotReservation.cutTypeLabel}</span>
                  </Link>
                ) : slotReservation ? (
                  null
                ) : isLunch ? (
                  <span className={styles.timelineLunchLabel}>Obedná prestávka</span>
                ) : (
                  <Link className={styles.timelineFreeSlot} href={`/admin/reservations/new?date=${selectedDay?.dateKey ?? anchorDate}&time=${slot}`}>
                    Voľné
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.calendarWeekGrid}>
        {data.days.map((day) => (
          <article key={day.dateKey} className={styles.calendarDayColumn}>
            <div className={styles.calendarDayHeader}>
              <h3>{day.label}</h3>
              <Link className="btn btn--ghost" href={`/admin/reservations/new?date=${day.dateKey}`}>
                + Rezervácia
              </Link>
            </div>
            <div className={styles.calendarDayContent}>
              {day.reservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  className={`${styles.calendarBlock} ${styles.calendarBlockConfirmed}`}
                  style={{ minHeight: `${Math.max(1, reservation.durationMin / 30) * 52}px` }}
                  href={`/admin/reservations/${reservation.id}`}
                >
                  <strong>{reservation.timeLabel}</strong>
                  <span>{reservation.dogName}</span>
                  <small>{reservation.cutTypeLabel} · {reservation.durationMin} min</small>
                </Link>
              ))}
              {day.pending.map((reservation) => (
                <Link
                  key={reservation.id}
                  className={`${styles.calendarBlock} ${styles.calendarBlockPending}`}
                  style={{ minHeight: `${Math.max(1, reservation.durationMin / 30) * 52}px` }}
                  href={`/admin/reservations/${reservation.id}`}
                >
                  <strong>{reservation.timeLabel}</strong>
                  <span>{reservation.dogName}</span>
                  <small>{reservation.cutTypeLabel} · {reservation.durationMin} min</small>
                </Link>
              ))}
              <div className={styles.calendarLunchBand}>Obedná prestávka 13:00 - 14:00</div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
