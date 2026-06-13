export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ArrowRight, Clock3, PawPrint, Scissors } from 'lucide-react';
import styles from '../admin.module.css';
import { LogoutButton } from '../logout-button';
import { getAdminDashboardData } from '@/lib/admin-data';
import { shiftDateKey } from '@/lib/admin-domain';
import { requireAdminUser } from '@/lib/admin-session';
import { getBratislavaDateKey } from '@/lib/time';

function formatDashboardDate(dateKey: string): string {
  const date = new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00Z`));

  return date.charAt(0).toUpperCase() + date.slice(1);
}

function ScheduleRow({
  reservation,
  featured = false,
}: {
  reservation: Awaited<ReturnType<typeof getAdminDashboardData>>['today'][number];
  featured?: boolean;
}) {
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
              {reservation.customerName} · {reservation.dogBreed ?? 'Bez plemena'} · {reservation.dogSizeLabel}
            </p>
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
      </div>
    </article>
  );
}

function TomorrowRow({
  reservation,
}: {
  reservation: Awaited<ReturnType<typeof getAdminDashboardData>>['tomorrow'][number];
}) {
  return (
    <article className={styles.tomorrowRow}>
      <span>{reservation.timeLabel}</span>
      <div>
        <strong>{reservation.dogName}</strong>
        <p>
          {reservation.customerName} · {reservation.cutTypeLabel}
        </p>
      </div>
      <span>{reservation.durationMin} min</span>
    </article>
  );
}

export default async function AdminHomePage() {
  const [dashboard, user] = await Promise.all([getAdminDashboardData(), requireAdminUser()]);
  const todayKey = getBratislavaDateKey();
  const tomorrowKey = shiftDateKey(todayKey, 1);

  return (
    <div className={styles.dashboardPage}>
      <section className={styles.scheduleSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.scheduleHeaderTitle}>
            <p className={styles.sectionKicker}>Dnes</p>
            <h1 className={styles.scheduleHeaderCount}>{dashboard.today.length} rezervácií</h1>
          </div>
          <div className={styles.dashboardDateChip}>{formatDashboardDate(todayKey)}</div>
        </div>

        {dashboard.today.length > 0 ? (
          <div className={styles.scheduleList}>
            {dashboard.today.map((reservation, index) => (
              <ScheduleRow key={reservation.id} reservation={reservation} featured={index === 0} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyStatePanel}>
            <Clock3 size={20} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <strong>Dnes zatiaľ nemáte žiadne rezervácie.</strong>
              <p>Harmonogram sa tu zobrazí, keď pribudne termín.</p>
            </div>
          </div>
        )}
      </section>

      <section className={styles.tomorrowCard}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>Zajtra</p>
              <h2 className={styles.sectionTitle}>{dashboard.tomorrow.length} rezervácií</h2>
            </div>
          <Link className={styles.sectionLink} href={`/admin/calendar?date=${tomorrowKey}&view=day&day=${tomorrowKey}`}>
            Zobraziť v kalendári <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.tomorrowList}>
          {dashboard.tomorrow.length > 0 ? (
            dashboard.tomorrow.map((reservation) => (
              <TomorrowRow key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <p className={styles.emptyState}>Na zajtra nie sú naplánované rezervácie.</p>
          )}
        </div>
      </section>

      <section className={styles.pendingSummaryCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Čakajúce žiadosti</p>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>{dashboard.pendingCount}</h2>
              <span className={styles.sectionCountBadge}>na schválenie</span>
            </div>
          </div>
          <Link className={styles.sectionLink} href="/admin/reservations?tab=pending">
            Zobraziť všetky <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className={styles.accountCard}>
        <div className={styles.accountCardCopy}>
          <p className={styles.sectionKicker}>Účet</p>
          <h2 className={styles.sectionTitle}>Eva</h2>
          <p className={styles.accountEmail}>{user.email ?? user.id}</p>
        </div>
        <LogoutButton />
      </section>
    </div>
  );
}
