export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../admin.module.css';
import { listAdminReservations } from '@/lib/admin-data';
import type { AdminReservationTab } from '@/lib/admin-domain';

const tabs: { key: AdminReservationTab; label: string }[] = [
  { key: 'pending', label: 'Čakajúce' },
  { key: 'confirmed', label: 'Potvrdené' },
  { key: 'history', label: 'História' },
];

function getTabLabel(tab: AdminReservationTab) {
  return tabs.find((item) => item.key === tab)?.label ?? 'Rezervácie';
}

function formatTelHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const tab = (params.tab === 'confirmed' || params.tab === 'history' ? params.tab : 'pending') as AdminReservationTab;
  const reservations = await listAdminReservations(tab);

  return (
    <div className={styles.reservationsPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Rezervácie</p>
          <h1 className={styles.pageTitle}>{getTabLabel(tab)}</h1>
          <p className={styles.pageLead}>
            Žiadosti, potvrdené termíny a história na jednom mieste.
          </p>
        </div>
        <Link className="btn btn--primary" href="/admin/reservations/new">
          + Nová rezervácia
        </Link>
      </section>

      <nav className={styles.tabs} aria-label="Typ rezervácií">
        {tabs.map((item) => (
          <Link
            key={item.key}
            className={`${styles.tabLink} ${item.key === tab ? styles.tabLinkActive : ''}`}
            href={`/admin/reservations?tab=${item.key}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {reservations.length > 0 ? (
        <div className={styles.reservationGrid}>
          {reservations.map((reservation) => (
            <article key={reservation.id} className={styles.reservationCard}>
              <div className={styles.reservationTop}>
                <div>
                  <p className={styles.reservationClock}>{reservation.startLabel}</p>
                  <p className={styles.reservationMeta}>
                    {reservation.dogName} · {reservation.dogSizeLabel} · {reservation.cutTypeLabel}
                  </p>
                </div>
                <span className={styles.statusPill}>{reservation.statusLabel}</span>
              </div>

              <p className={styles.reservationServices}>{reservation.serviceLabel}</p>

              <div className={styles.reservationContact}>
                <a className={styles.callLink} href={formatTelHref(reservation.customerPhone)}>
                  {reservation.customerName}
                </a>
                <a className={styles.callLinkSecondary} href={formatTelHref(reservation.customerPhone)}>
                  {reservation.customerPhone}
                </a>
              </div>

              <div className={styles.reservationActions}>
                <Link className="btn btn--ghost" href={`/admin/reservations/${reservation.id}`}>
                  Otvoriť detail
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>Zatiaľ žiadne žiadosti.</p>
      )}
    </div>
  );
}

