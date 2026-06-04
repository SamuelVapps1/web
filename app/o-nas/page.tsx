import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevealOnScroll from '@/components/RevealOnScroll';
import Photo from '@/components/Photo';
import BookingCTA from '@/components/BookingCTA';
import { galleryAlt, galleryTeaser } from '@/data/gallery';
import { aboutInterior } from '@/data/site-images';
import { Scissors, Images } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'O nás',
  description:
    'Tridsať rokov za nožnicami v Petržalke. Tisíce psov, takmer každé plemeno a každý typ srsti — skúsenosť, ktorú na psovi vidno.',
  alternates: { canonical: '/o-nas' },
};

export default function ONas() {
  return (
    <>
      <Header />

      <main>
        <header className="pagehead">
          <div className="pagehead__eyebrow">
            <span className="eyebrow">O nás</span>
          </div>
          <h1>O nás</h1>
          <p className="lead">Vypočujeme Vašu predstavu a hovoríme na rovinu o tom, čo je možné a pre Vášho psa najlepšie.</p>
        </header>

        <div className="wrap">
          <RevealOnScroll>
            <div className="story">
              <div className="story__media">
                <div className="story__photo">
                  <Photo src={aboutInterior} alt="Salón Laura zvnútra — pracovisko groomera" width={700} height={640} placeholder="" sizes="(max-width: 1060px) 100vw, 50vw" />
                </div>
                <div className="story__heritage">
                  <Scissors aria-hidden="true" />
                  <span>Tridsať rokov<br />za nožnicami</span>
                </div>
              </div>
              <div className="story__body">
                <hr className="story__rule rule-brass" />
                <p className="lead-first serif">
                  Úprave zvierat sa venujeme viac ako 30 rokov. Za ten čas nám cez ruky prešli tisíce psov — takmer každé plemeno, všetky typy srsti a rôzne povahy zvierat.
                </p>
                <p>
                  Za tie roky sme sa naučili, že pes sa strihá podľa toho, čo má groomer pred sebou — nie podľa fotky z internetu. A to sa na týždňovom kurze strihania nenaučíte.
                </p>
                <p>
                  Ak máte psa, s ktorým si inde nevedeli rady — starého, splstnateného alebo takého, čo sa ťažko zvláda — <em>zavolajte. Máme skúsenosť s akoukoľvek situáciou.</em>
                </p>
              </div>
            </div>
          </RevealOnScroll>

          <div className="creds">
            <RevealOnScroll>
              <div className="creds__head">
                <span className="eyebrow">Z galérie</span>
                <hr className="rule-brass" />
              </div>
            </RevealOnScroll>
            <div className="creds__grid">
              {galleryTeaser.map((item) => (
                <RevealOnScroll key={item.id}>
                  <Photo src={item.after} alt={galleryAlt(item)} width={400} height={300} placeholder="" sizes="(max-width: 680px) 100vw, 33vw" />
                </RevealOnScroll>
              ))}
            </div>
            <div className="creds__cta">
              <Link className="btn btn--ghost" href="/galeria">
                <Images aria-hidden="true" /> Pozrieť celú galériu
              </Link>
            </div>
          </div>
        </div>

        <BookingCTA showReservacia />
      </main>

      <Footer />
    </>
  );
}
