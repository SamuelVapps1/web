import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingWizard from './_components/booking-wizard';
import styles from './booking.module.css';
import { listReservationsBetween } from '@/lib/db';
import { addDaysToDateKey, endOfBratislavaDayUtc, getBratislavaDateKey, startOfBratislavaDayUtc } from '@/lib/time';
import { serializeReservationRecord, type SerializedReservationRecord } from '@/lib/reservations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rezervácia termínu',
  description: 'Vyberte termín a povedzte nám o vašom psovi. Ozveme sa s potvrdením.',
  alternates: { canonical: '/rezervacia' },
};

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function RezervaciaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const todayDateKey = getBratislavaDateKey();
  const queryStart = startOfBratislavaDayUtc(todayDateKey);
  const queryEnd = endOfBratislavaDayUtc(addDaysToDateKey(todayDateKey, 365));

  let reservations: SerializedReservationRecord[] = [];
  try {
    const rows = await listReservationsBetween(queryStart, queryEnd);
    reservations = rows.map(serializeReservationRecord);
  } catch {
    reservations = [];
  }

  const utmSource = getQueryValue(searchParams.utm_source);
  const utmMedium = getQueryValue(searchParams.utm_medium);
  const utmCampaign = getQueryValue(searchParams.utm_campaign);
  const discountCode = getQueryValue(searchParams.discount_code);

  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <h1>Rezervácia termínu</h1>
            <p className={styles.subtitle}>Vyberte termín a povedzte nám o vašom psovi. Ozveme sa s potvrdením.</p>
          </div>
        </section>

        <section className={styles.content}>
          <BookingWizard
            reservations={reservations}
            todayDateKey={todayDateKey}
            utmSource={utmSource}
            utmMedium={utmMedium}
            utmCampaign={utmCampaign}
            discountCode={discountCode}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
