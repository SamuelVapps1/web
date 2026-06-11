import Link from 'next/link';
import styles from '../../admin.module.css';
import ManualReservationForm from '../reservations/new/manual-reservation-form';

export default function CalendarReservationModal({
  closeHref,
  customers,
  initialDate,
  initialTime,
}: {
  closeHref: string;
  customers: {
    id: string;
    name: string;
    phone: string;
    dogs: { id: string; name: string; breed: string | null; size: string }[];
  }[];
  initialDate: string;
  initialTime: string;
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation">
      <section className={styles.modalSheet} role="dialog" aria-modal="true" aria-label="Nová rezervácia">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionKicker}>Nová rezervácia</p>
            <h2 className={styles.sectionTitle}>Rýchla rezervácia</h2>
            <p className={styles.detailMeta}>
              Predvyplnené: {initialDate} · {initialTime}
            </p>
          </div>
          <Link className="btn btn--ghost" href={closeHref}>
            Zavrieť
          </Link>
        </div>

        <ManualReservationForm customers={customers} initialDate={initialDate} initialTime={initialTime} />
      </section>
    </div>
  );
}
