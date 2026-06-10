import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Rezervácia termínu',
  description: 'Online rezervácie spúšťame čoskoro.',
  alternates: { canonical: '/rezervacia' },
};

const openingHours = [
  'Po–Pia 10:00–13:00',
  'Po–Pia 14:00–18:00',
];

export default function RezervaciaPage() {
  return (
    <>
      <Header />
      <main
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(3rem, 8vw, 6rem) 1.25rem',
        }}
      >
        <section
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: 'clamp(2rem, 4vw, 3.5rem)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <p className="eyebrow">Rezervácie</p>
          <h1 style={{ marginTop: '0.85rem', fontSize: 'clamp(2.2rem, 4vw, 3.6rem)' }}>
            Online rezervácie spúšťame čoskoro
          </h1>
          <p className="lead" style={{ marginTop: '1rem', maxWidth: '42ch' }}>
            Kým pripravujeme nový rezervačný systém, rezerváciu vybavíme telefonicky počas
            otváracích hodín.
          </p>

          <div
            style={{
              display: 'grid',
              gap: '1rem',
              marginTop: '2rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <a
              className="btn btn--primary"
              href="tel:+421944240116"
              style={{ textAlign: 'center' }}
            >
              Zavolať +421 944 240 116
            </a>
            <Link className="btn btn--ghost" href="/kontakt" style={{ textAlign: 'center' }}>
              Kontaktné údaje
            </Link>
          </div>

          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--hairline)',
            }}
          >
            <p className="eyebrow">Otváracie hodiny</p>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '1rem 0 0',
                display: 'grid',
                gap: '0.65rem',
                color: 'var(--ink-soft)',
              }}
            >
              {openingHours.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
