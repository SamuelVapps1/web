export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  PawPrint,
  Phone,
  Plus,
  Printer,
  Scissors,
} from 'lucide-react';
import styles from '../admin.module.css';
import { completeReservation, confirmReservation } from '@/app/admin/actions';
import { getAdminDashboardData, listAdminReservations } from '@/lib/admin-data';
import { shiftDateKey } from '@/lib/admin-domain';
import { getBratislavaDateKey } from '@/lib/time';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDashboardDate(dateKey: string): string {
  const date = new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00Z`));

  return capitalize(date);
}

function formatRelativeAge(iso: string): string {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  if (diffMinutes < 60) {
    return `pred ${diffMinutes} min`;
  }

  const diffHours = Math.max(1, Math.round(diffMinutes / 60));
  return `pred ${diffHours} h`;
}

function toDateInputValue(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function toTimeInputValue(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bratislava',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

async function submitConfirmReservation(formData: FormData) {
  'use server';
  await confirmReservation(formData);
}

async function submitCompleteReservation(formData: FormData) {
  'use server';
  await completeReservation(formData);
}

function PhoneButton({ phone }: { phone: string }) {
  return (
    <a className={`btn btn--ghost ${styles.phoneButton}`} href={`tel:${phone.replace(/\s+/g, '')}`}>
      <Phone size={18} strokeWidth={1.8} aria-hidden="true" />
      <span>{phone}</span>
    </a>
  );
}

function ActionMenu({ todayKey }: { todayKey: string }) {
  return (
    <details className={styles.actionMenu}>
      <summary className="btn btn--ghost">
        Akcie dňa
        <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
      </summary>
      <div className={styles.actionMenuPanel}>
        <Link href={`/admin/calendar?date=${todayKey}&view=week`} className={styles.actionMenuLink}>
          Kalendár
        </Link>
        <Link href="/admin/reservations" className={styles.actionMenuLink}>
          Rezervácie
        </Link>
        <Link href="/admin/customers" className={styles.actionMenuLink}>
          Zákazníci
        </Link>
      </div>
    </details>
  );
}

function PendingRequestCard({
  reservation,
}: {
  reservation: Awaited<ReturnType<typeof listAdminReservations>>[number];
}) {
  const dateValue = toDateInputValue(reservation.requestedStart);
  const timeValue = toTimeInputValue(reservation.requestedStart);

  return (
    <article className={styles.requestListItem}>
      <div className={styles.requestCardTop}>
        <div className={styles.requestCardIcon} aria-hidden="true">
          <Clock3 size={18} strokeWidth={1.8} />
        </div>
        <span className={styles.requestAge}>{formatRelativeAge(reservation.createdAt)}</span>
      </div>

      <div className={styles.requestListCopy}>
        <strong>{reservation.dogName}</strong>
        <span>
          {reservation.dogBreed ?? 'Bez plemena'} · {reservation.dogSizeLabel}
        </span>
      </div>

      <div className={styles.requestListSlot}>
        <strong>
          {reservation.dateLabel} · {reservation.timeLabel}
        </strong>
        <span>{reservation.cutTypeLabel}</span>
      </div>

      <div className={styles.requestActions}>
        <Link className="btn btn--ghost" href={`/admin/reservations/${reservation.id}`}>
          Otvoriť
        </Link>
        <form action={submitConfirmReservation} className={styles.inlineActionForm}>
          <input type="hidden" name="id" value={reservation.id} />
          <input type="hidden" name="date" value={dateValue} />
          <input type="hidden" name="time" value={timeValue} />
          <input type="hidden" name="durationMin" value={reservation.durationMin} />
          <input type="hidden" name="internalNote" value={reservation.internalNote ?? ''} />
          <button className="btn btn--primary" type="submit">
            Prijať
          </button>
        </form>
      </div>
    </article>
  );
}

function ScheduleRow({
  reservation,
  featured = false,
}: {
  reservation: Awaited<ReturnType<typeof getAdminDashboardData>>['today'][number];
  featured?: boolean;
}) {
  const timeIso = reservation.confirmedStart ?? reservation.requestedStart;
  const dateValue = toDateInputValue(timeIso);
  const timeValue = toTimeInputValue(timeIso);

  return (
    <article className={`${styles.scheduleRow} ${featured ? styles.scheduleRowFeatured : ''}`}>
      <div className={styles.scheduleTimeColumn}>
        <span className={styles.scheduleTime}>{reservation.timeLabel}</span>
        <span className={styles.scheduleDuration}>{reservation.durationMin} min</span>
      </div>

      <div className={styles.scheduleBody}>
        <div className={styles.scheduleBodyTop}>
          <div>
            <h3 className={styles.scheduleName}>{reservation.dogName}</h3>
            <p className={styles.scheduleMeta}>
              {reservation.dogBreed ?? 'Bez plemena'} · {reservation.dogSizeLabel}
            </p>
            <p className={styles.scheduleMeta}>Majiteľ: {reservation.customerName}</p>
          </div>
          <span className={styles.statusPill}>{reservation.statusLabel}</span>
        </div>

        <div className={styles.scheduleDetails}>
          <span>
            <Scissors size={15} strokeWidth={1.85} aria-hidden="true" />
            {reservation.cutTypeLabel}
          </span>
          <span>
            <PawPrint size={15} strokeWidth={1.85} aria-hidden="true" />
            {reservation.serviceLabel}
          </span>
        </div>

        <p className={styles.scheduleNote}>{reservation.internalNote ?? 'Bez internej poznámky'}</p>
      </div>

      <div className={styles.scheduleActions}>
        <Link className="btn btn--ghost" href={`/admin/reservations/${reservation.id}`}>
          Otvoriť
        </Link>
        {reservation.status === 'CONFIRMED' ? (
          <form action={submitCompleteReservation} className={styles.inlineActionForm}>
            <input type="hidden" name="id" value={reservation.id} />
            <button className="btn btn--primary" type="submit">
              Ukončiť
            </button>
          </form>
        ) : (
          <form action={submitConfirmReservation} className={styles.inlineActionForm}>
            <input type="hidden" name="id" value={reservation.id} />
            <input type="hidden" name="date" value={dateValue} />
            <input type="hidden" name="time" value={timeValue} />
            <input type="hidden" name="durationMin" value={reservation.durationMin} />
            <input type="hidden" name="internalNote" value={reservation.internalNote ?? ''} />
            <button className="btn btn--primary" type="submit">
              Prijať
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

export default async function AdminHomePage() {
  const [dashboard, pendingReservations] = await Promise.all([
    getAdminDashboardData(),
    listAdminReservations('pending'),
  ]);

  const todayKey = getBratislavaDateKey();
  const previousDateKey = shiftDateKey(todayKey, -1);
  const nextDateKey = shiftDateKey(todayKey, 1);
  const selectedReservation = dashboard.today[0] ?? pendingReservations[0] ?? dashboard.tomorrow[0] ?? null;
  const visibleTimeline = dashboard.today.slice(0, 5);
  const visiblePending = pendingReservations.slice(0, 3);
  const tomorrowPreview = dashboard.tomorrow.slice(0, 4);

  return (
    <div className={styles.dashboardPage}>
      <section className={styles.dashboardHeader}>
        <div className={styles.dashboardHeaderCopy}>
          <div className={styles.dashboardTitleRow}>
            <p className={styles.eyebrow}>Dnes</p>
            <div className={styles.dashboardDateChip}>{formatDashboardDate(todayKey)}</div>
          </div>
          <h1 className={styles.heroTitle}>Dnes</h1>
          <p className={styles.heroLead}>
            Rýchly prehľad dňa, čakajúcich žiadostí a aktuálne otvoreného termínu.
          </p>
        </div>

        <div className={styles.dashboardHeaderActions}>
          <div className={styles.dayNavGroup} aria-label="Prepínanie dňa">
            <Link className="btn btn--ghost" href={`/admin/calendar?date=${previousDateKey}&view=week`}>
              <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <Link className="btn btn--ghost" href={`/admin/calendar?date=${nextDateKey}&view=week`}>
              <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
          <PhoneButton phone="+421 944 240 116" />
          <Link className="btn btn--primary" href="/admin/reservations/new">
            <Plus size={18} strokeWidth={1.8} aria-hidden="true" />
            Nová rezervácia
          </Link>
        </div>
      </section>

      <section className={styles.requestsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.sectionTitleRow}>
              <p className={styles.sectionKicker}>Čakajúce žiadosti</p>
              <span className={styles.sectionCountBadge}>{pendingReservations.length}</span>
            </div>
            <p className={styles.sectionSubcopy}>Vyžadujú vašu pozornosť</p>
          </div>
          <Link className={styles.sectionLink} href="/admin/reservations?tab=pending">
            Zobraziť všetky <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {visiblePending.length > 0 ? (
          <div className={styles.requestList}>
            {visiblePending.map((reservation) => (
              <PendingRequestCard key={reservation.id} reservation={reservation} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyBanner}>
            <Clock3 size={20} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <strong>Momentálne nemáte čakajúce žiadosti.</strong>
              <p>Keď príde nová rezervácia, zobrazí sa tu automaticky.</p>
            </div>
          </div>
        )}
      </section>

      <div className={styles.dashboardLayout}>
        <section className={styles.scheduleSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.scheduleHeaderTitle}>
              <p className={styles.sectionKicker}>Harmonogram dňa</p>
              <h2 className={styles.scheduleHeaderCount}>{dashboard.today.length} rezervácií</h2>
            </div>
            <div className={styles.sectionTools}>
              <Link className="btn btn--ghost" href={`/admin/calendar?date=${todayKey}&view=week`}>
                <Printer size={18} strokeWidth={1.8} aria-hidden="true" />
                Tlačiť prehľad dňa
              </Link>
              <ActionMenu todayKey={todayKey} />
            </div>
          </div>

          {visibleTimeline.length > 0 ? (
            <div className={styles.scheduleList}>
              {visibleTimeline.map((reservation, index) => (
                <ScheduleRow key={reservation.id} reservation={reservation} featured={index === 0} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyStatePanel}>
              <Clock3 size={20} strokeWidth={1.8} aria-hidden="true" />
              <div>
                <strong>Dnes zatiaľ nemáte žiadne rezervácie.</strong>
                <p>Keď sa niečo objaví, harmonogram sa tu naplní automaticky.</p>
              </div>
            </div>
          )}

          <div className={styles.scheduleFooter}>
            <Link className="btn btn--ghost" href={`/admin/calendar?date=${todayKey}&view=week`}>
              Zobraziť voľné termíny
            </Link>
          </div>
        </section>

        <aside className={styles.sideRail}>
          {selectedReservation ? (
            <article className={styles.detailHero}>
              <div className={styles.detailHeroTop}>
                <div>
                  <h2 className={styles.detailName}>{selectedReservation.dogName}</h2>
                  <p className={styles.detailMeta}>
                    {selectedReservation.dogBreed ?? 'Bez plemena'} · {selectedReservation.dogSizeLabel}
                  </p>
                  <p className={styles.detailMeta}>
                    {selectedReservation.customerName} · {selectedReservation.customerPhone}
                  </p>
                </div>
                <span className={styles.statusPill}>{selectedReservation.statusLabel}</span>
              </div>

              <div className={styles.detailFacts}>
                <div className={styles.detailFactRow}>
                  <Clock3 size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>
                    {selectedReservation.dateLabel} · {selectedReservation.timeLabel} · {selectedReservation.durationMin} min
                  </span>
                </div>
                <div className={styles.detailFactRow}>
                  <Scissors size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>{selectedReservation.cutTypeLabel}</span>
                </div>
                <div className={styles.detailFactRow}>
                  <PawPrint size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>{selectedReservation.serviceLabel}</span>
                </div>
                <div className={styles.detailFactRow}>
                  <MapPin size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>Petržalka · Laura salón pre psov</span>
                </div>
              </div>

              <div className={styles.detailNoteBlock}>
                <div className={styles.detailNoteHeader}>
                  <strong>Interná poznámka</strong>
                  <Link href={`/admin/reservations/${selectedReservation.id}`}>Upraviť</Link>
                </div>
                <p>{selectedReservation.internalNote ?? 'Bez internej poznámky'}</p>
              </div>

              <div className={styles.detailActions}>
                {selectedReservation.status === 'CONFIRMED' ? (
                  <form action={submitCompleteReservation}>
                    <input type="hidden" name="id" value={selectedReservation.id} />
                    <button className="btn btn--primary" type="submit">
                      <Check size={18} strokeWidth={1.8} aria-hidden="true" />
                      Ukončiť rezerváciu
                    </button>
                  </form>
                ) : selectedReservation.status === 'PENDING' ? (
                  <form action={submitConfirmReservation}>
                    <input type="hidden" name="id" value={selectedReservation.id} />
                    <input type="hidden" name="date" value={toDateInputValue(selectedReservation.requestedStart)} />
                    <input type="hidden" name="time" value={toTimeInputValue(selectedReservation.requestedStart)} />
                    <input type="hidden" name="durationMin" value={selectedReservation.durationMin} />
                    <input type="hidden" name="internalNote" value={selectedReservation.internalNote ?? ''} />
                    <button className="btn btn--primary" type="submit">
                      <Check size={18} strokeWidth={1.8} aria-hidden="true" />
                      Prijať rezerváciu
                    </button>
                  </form>
                ) : (
                  <Link className="btn btn--ghost" href={`/admin/reservations/${selectedReservation.id}`}>
                    Otvoriť detail
                  </Link>
                )}
                <Link className="btn btn--ghost" href={`/admin/reservations/${selectedReservation.id}`}>
                  Upraviť rezerváciu
                </Link>
              </div>
            </article>
          ) : (
            <article className={styles.detailHero}>
              <p className={styles.sectionKicker}>Vybraný termín</p>
              <h2 className={styles.detailName}>Bez vybranej rezervácie</h2>
              <p className={styles.detailMeta}>Keď vyberiete termín, objavia sa tu detaily a akcie.</p>
            </article>
          )}

          <article className={styles.tomorrowCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionKicker}>Zajtra</p>
                <h2 className={styles.sectionTitle}>{dashboard.tomorrow.length} rezervácií</h2>
              </div>
              <Link className={styles.sectionLink} href="/admin/calendar">
                Zobraziť celý deň <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.tomorrowList}>
              {tomorrowPreview.length > 0 ? (
                tomorrowPreview.map((reservation) => (
                  <div key={reservation.id} className={styles.tomorrowRow}>
                    <span>{reservation.timeLabel}</span>
                    <strong>{reservation.dogName}</strong>
                    <span>{reservation.durationMin} min</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>Na zajtra nie sú naplánované rezervácie.</p>
              )}
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
