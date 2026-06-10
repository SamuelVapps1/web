export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../admin.module.css';
import { getAdminDashboardData } from '@/lib/admin-data';
import { ADMIN_TIME_WINDOW } from '@/lib/admin-schedule.js';

function formatTelHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

function getStatusLabel(status: string) {
  if (status === 'CONFIRMED') return 'Potvrdená';
  if (status === 'PENDING') return 'Čaká';
  if (status === 'DONE') return 'Hotová';
  return 'Zrušená';
}

function ReservationList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Awaited<ReturnType<typeof getAdminDashboardData>>['today'];
  emptyLabel: string;
}) {
  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionKicker}>{title}</p>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
      </div>

      {items.length > 0 ? (
        <div className={styles.listStack}>
          {items.map((reservation) => (
            <article key={reservation.id} className={styles.listCard}>
              <div className={styles.listCardTop}>
                <div>
                  <p className={styles.listCardTime}>{reservation.timeLabel}</p>
                  <p className={styles.listCardMeta}>
                    {reservation.dogName} · {reservation.cutTypeLabel}
                  </p>
                </div>
                <span className={styles.statusPill}>{getStatusLabel(reservation.status)}</span>
              </div>
              <div className={styles.listCardBody}>
                <p className={styles.listCardDetail}>{reservation.serviceLabel}</p>
                <a className={styles.callLink} href={formatTelHref(reservation.customerPhone)}>
                  {reservation.customerName} · {reservation.customerPhone}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>{emptyLabel}</p>
      )}
    </section>
  );
}

export default async function AdminHomePage() {
  const data = await getAdminDashboardData();

  return (
    <div className={styles.dashboardPage}>
      <section className={styles.heroPanel}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Prehľad</p>
          <h1 className={styles.heroTitle}>Dnešný deň, zajtrajšok a čakajúce žiadosti na jednom mieste.</h1>
          <p className={styles.heroLead}>
            Tu majiteľka rýchlo skontroluje, komu volať, čo potvrdiť a čo posunúť do kalendára.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link className="btn btn--primary" href="/admin/reservations/new">
            + Nová rezervácia
          </Link>
          <Link className={`btn btn--ghost ${data.pendingCount > 0 ? styles.badgeButton : ''}`} href="/admin/reservations?tab=pending">
            Čaká na vybavenie: {data.pendingCount}
          </Link>
        </div>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Čaká na vybavenie</p>
          <p className={styles.metricValue}>{data.pendingCount}</p>
          <Link className="btn btn--ghost" href="/admin/reservations?tab=pending">
            Otvoriť zoznam
          </Link>
        </article>

        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Dnes</p>
          <p className={styles.metricValue}>{data.today.length}</p>
          <p className={styles.metricCopy}>Potvrdené rezervácie dnes.</p>
        </article>

        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Zajtra</p>
          <p className={styles.metricValue}>{data.tomorrow.length}</p>
          <p className={styles.metricCopy}>Potvrdené rezervácie na zajtra.</p>
        </article>
      </section>

      <section className={styles.dashboardColumns}>
        <ReservationList
          title="Dnes"
          items={data.today}
          emptyLabel="Zatiaľ nie sú potvrdené dnešné rezervácie."
        />
        <ReservationList
          title="Zajtra"
          items={data.tomorrow}
          emptyLabel="Zatiaľ nie sú potvrdené zajtrajšie rezervácie."
        />
      </section>

      <section className={styles.dashboardNote}>
        <p className={styles.sectionKicker}>Pracovný čas</p>
        <p className={styles.dashboardNoteText}>
          Po - Pia {ADMIN_TIME_WINDOW.start} - {ADMIN_TIME_WINDOW.lunchStart} a {ADMIN_TIME_WINDOW.lunchEnd} - {ADMIN_TIME_WINDOW.end}
        </p>
      </section>
    </div>
  );
}
