import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookingFlow } from './_components/booking-flow';
import styles from './booking.module.css';

export const metadata: Metadata = {
  title: 'Rezervácia termínu',
  description: 'Pošlite nám žiadosť o termín online. Potvrdenie vybavíme telefonicky.',
  alternates: { canonical: '/rezervacia' },
};

export default function RezervaciaPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <p className={styles.eyebrow}>Rezervácie</p>
            <h1>Pošlite nám žiadosť o termín online</h1>
            <p className={styles.subtitle}>
              My si profil psa a služby spracujeme hneď po odoslaní. Termín potvrdíme telefonicky
              a ak bude treba, doladíme detaily ešte pred návštevou.
            </p>
          </div>
        </section>

        <section className={styles.content}>
          <BookingFlow />
        </section>
      </main>
      <Footer />
    </>
  );
}
