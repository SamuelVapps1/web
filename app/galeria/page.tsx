import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingCTA from '@/components/BookingCTA';
import GalleryLightbox from '@/components/GalleryLightbox';
import { GALLERY_ITEMS } from '@/data/gallery';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galéria prác',
  description:
    'Galéria úprav psov — pred a po. Od jednoduchých kúpeľov až po komplexné plemenné a výstavné strihy v salóne Laura v Petržalke.',
  alternates: { canonical: '/galeria' },
};

export default function Galeria() {
  return (
    <>
      <Header />

      <main>
        <header className="pagehead">
          <div className="pagehead__eyebrow">
            <span className="eyebrow">Galéria</span>
          </div>
          <h1>Galéria</h1>
          <p className="lead">Tridsať rokov za nožnicami. Pozrite sa.</p>
        </header>

        <div className="wrap">
          <GalleryLightbox items={GALLERY_ITEMS} />
        </div>

        <BookingCTA />
      </main>

      <Footer />
    </>
  );
}
