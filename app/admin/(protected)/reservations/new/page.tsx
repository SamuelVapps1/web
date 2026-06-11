export const dynamic = 'force-dynamic';

import styles from '../../../admin.module.css';
import { getAdminManualReservationContext } from '@/lib/admin-data';
import ManualReservationForm from './manual-reservation-form';

export default async function NewManualReservationPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string; time?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const data = await getAdminManualReservationContext();

  return (
    <div className={styles.manualPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Nová rezervácia</p>
          <h1 className={styles.pageTitle}>Rýchla rezervácia po telefóne</h1>
          <p className={styles.pageLead}>Najprv zákazník, potom pes, potom termín.</p>
        </div>
      </section>

      <ManualReservationForm
        customers={data.customers}
        availabilityReservations={data.availabilityReservations}
        initialDate={params.date}
        initialTime={params.time}
      />
    </div>
  );
}
