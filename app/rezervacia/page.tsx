import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookingFlow } from './_components/booking-flow';
import styles from './booking.module.css';

export const metadata: Metadata = {
  title: 'Rezervácia termínu',
  description: 'Pošlite nám žiadosť o termín online. Termín vám potvrdíme.',
  alternates: { canonical: '/rezervacia' },
};

export default function RezervaciaPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.content}>
          <BookingFlow />
        </section>
      </main>
      <Footer />
    </>
  );
}
