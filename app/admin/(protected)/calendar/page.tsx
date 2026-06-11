export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { ReactNode } from 'react';
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
  const dayParam = params.day && data.days.some((day) => day.dateKey === params.day) ? params.day : data.days.find((day) => day.isCurrentMonth)?.dateKey ?? data.days[0]?.dateKey;
  const selectedDay = data.days.find((day) => day.dateKey === dayParam) ?? data.days[0];
  const slots = buildWorkingDaySlots();
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
          <Link className="btn btn--primary" href={`${baseReservationHref}&reservationDate=${selectedDay?.dateKey ?? anchorDate}&reservationTime=10:00`}>
            + Nová rezervácia
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
        <>
          <nav className={styles.calendarDaysNav} aria-label="Dni v týždni">
            {data.days.map((day) => (
              <Link
                key={day.dateKey}
                className={`${styles.calendarDayNav} ${selectedDay?.dateKey === day.dateKey ? styles.calendarDayNavActive : ''}`}
                href={`/admin/calendar?date=${anchorDate}&view=week&day=${day.dateKey}`}
              >
                {day.label}
              </Link>
            ))}
          </nav>

          <section className={styles.calendarMobilePanel}>
            <div className={styles.calendarMobileHeader}>
              <h2>{selectedDay?.label}</h2>
              <div className={styles.calendarMobileNav}>
                <Link className="btn btn--ghost" href={`/admin/calendar?date=${anchorDate}&view=week&day=${data.days[0]?.dateKey ?? anchorDate}`}>
                  Zobraziť prvý deň
                </Link>
                <Link className="btn btn--ghost" href={`/admin/calendar?date=${anchorDate}&view=week&day=${data.days[data.days.length - 1]?.dateKey ?? anchorDate}`}>
                  Zobraziť posledný deň
                </Link>
              </div>
            </div>

            <div className={styles.dayTimeline}>
              {slots.map((slot) => {
                const dayReservations = [...(selectedDay?.reservations ?? []), ...(selectedDay?.pending ?? [])];
                const slotReservation = dayReservations.find((reservation) => reservation.timeLabel === slot);
                const isLunch = slot >= ADMIN_TIME_WINDOW.lunchStart && slot < ADMIN_TIME_WINDOW.lunchEnd;

                if (slotReservation) {
                  return (
                    <div key={slot} className={`${styles.timelineSlot} ${isLunch ? styles.timelineLunch : ''}`}>
                      <span className={styles.timelineTime}>{hourLabel(slot)}</span>
                      <Link
                        className={`${styles.timelineCard} ${slotReservation.status === 'PENDING' ? styles.timelineCardPending : ''}`}
                        style={{ minHeight: `${Math.max(1, slotReservation.durationMin / 30) * 52}px` }}
                        href={`/admin/reservations/${slotReservation.id}`}
                      >
                        <strong>{slotReservation.dogName}</strong>
                        <span>{slotReservation.cutTypeLabel}</span>
                      </Link>
                    </div>
                  );
                }

                if (isLunch) {
                  return (
                    <div key={slot} className={`${styles.timelineSlot} ${styles.timelineLunch}`}>
                      <span className={styles.timelineTime}>{hourLabel(slot)}</span>
                      <span className={styles.timelineLunchLabel}>Obedná prestávka</span>
                    </div>
                  );
                }

                return (
                  <div key={slot} className={styles.timelineSlot}>
                    <span className={styles.timelineTime}>{hourLabel(slot)}</span>
                    <Link className={styles.timelineFreeSlot} href={`${baseReservationHref}&reservationDate=${selectedDay?.dateKey ?? anchorDate}&reservationTime=${slot}`}>
                      Voľné
                    </Link>
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
                  <Link className="btn btn--ghost" href={`${baseReservationHref}&reservationDate=${day.dateKey}&reservationTime=10:00`}>
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
                      <small>
                        {reservation.cutTypeLabel} · {reservation.durationMin} min
                      </small>
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
                      <small>
                        {reservation.cutTypeLabel} · {reservation.durationMin} min
                      </small>
                    </Link>
                  ))}
                  {day.history.map((reservation) => (
                    <Link
                      key={reservation.id}
                      className={styles.calendarBlock}
                      href={`/admin/reservations/${reservation.id}`}
                    >
                      <strong>{reservation.timeLabel}</strong>
                      <span>{reservation.dogName}</span>
                      <small>
                        {reservation.statusLabel} · {reservation.cutTypeLabel}
                      </small>
                    </Link>
                  ))}
                  <div className={styles.calendarLunchBand}>Obedná prestávka 13:00 - 14:00</div>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : (
        <>
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
        </>
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
          initialDate={reservationDate}
          initialTime={reservationTime}
        />
      ) : null}
    </div>
  );
}
