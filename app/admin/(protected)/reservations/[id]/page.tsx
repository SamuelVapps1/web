export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../../admin.module.css';
import { getAdminReservationDetail } from '@/lib/admin-data';
import ReservationDetailClient from './reservation-detail-client';

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getAdminReservationDetail(id);

  if (!reservation) {
    return (
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Rezervácia</p>
        <h1 className={styles.pageTitle}>Rezervácia sa nenašla</h1>
        <Link className="btn btn--ghost" href="/admin/reservations">
          Späť na zoznam
        </Link>
      </section>
    );
  }

  return (
    <div className={styles.detailPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Rezervácia</p>
          <h1 className={styles.pageTitle}>
            {reservation.dogName} · {reservation.customerName}
          </h1>
          <p className={styles.pageLead}>{reservation.startLabel}</p>
        </div>
        <Link className="btn btn--ghost" href="/admin/reservations">
          Späť na zoznam
        </Link>
      </section>

      <ReservationDetailClient reservation={reservation} />
    </div>
  );
}
