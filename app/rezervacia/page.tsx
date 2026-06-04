import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CalendarClock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rezervácia termínu',
  description:
    'Online rezervácie spúšťame čoskoro. Zatiaľ si termín dohodnite telefonicky na +421 944 240 116.',
  alternates: { canonical: '/rezervacia' },
};

export default function Rezervacia() {
  return (
    <>
      <Header />

      <main>
        <div className="booking">
          <div className="booking__card">
            <div className="booking__icon">
              <CalendarClock aria-hidden="true" />
            </div>
            <h1>Online rezervácie spúšťame čoskoro</h1>
            <p>
              Zatiaľ si termín dohodnite telefonicky — radi poradíme a nájdeme čas, ktorý vám sadne.
            </p>
            <a className="btn btn--primary" href="tel:+421944240116">
              Zavolať · +421 944 240 116
            </a>
            <p className="booking__hours">
              Po – Pia · 10:00 – 13:00 a 14:00 – 18:00 · Sobota – Nedeľa · zatvorené
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
