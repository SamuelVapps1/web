'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../../admin.module.css';
import ManualReservationForm from '../reservations/new/manual-reservation-form';

export default function CalendarReservationModal({
  closeHref,
  customers,
  availabilityReservations,
  initialDate,
  initialTime,
}: {
  closeHref: string;
  customers: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    note?: string | null;
    dogs: { id: string; name: string; breed: string | null; size: string; sizeLabel: string }[];
  }[];
  availabilityReservations: {
    id: string;
    status: string;
    statusLabel: string;
    requestedStart: string;
    confirmedStart: string | null;
    durationMin: number;
    customerName: string;
    dogName: string;
    customerPhone: string;
  }[];
  initialDate: string;
  initialTime: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        router.push(closeHref);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeHref, router]);

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

        <ManualReservationForm
          customers={customers}
          availabilityReservations={availabilityReservations}
          initialDate={initialDate}
          initialTime={initialTime}
        />
      </section>
    </div>
  );
}
