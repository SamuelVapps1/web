import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevealOnScroll from '@/components/RevealOnScroll';
import BookingCTA from '@/components/BookingCTA';
import { PRICING, ALA_CARTE } from '@/data/pricing';
import { Droplets } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cenník',
  description:
    'Cenník úpravy psov v Petržalke — strihanie, kúpanie a ďalšie úkony. Strih prispôsobíme plemenu, srsti aj povahe vášho psa.',
  alternates: { canonical: '/cennik' },
};

export default function Cennik() {
  return (
    <>
      <Header />

      <main>
        <header className="pagehead">
          <div className="pagehead__eyebrow">
            <span className="eyebrow">Cenník</span>
          </div>
          <h1>Cenník</h1>
          <p className="lead">Strih prispôsobíme Vášmu psovi — jeho plemenu, srsti aj povahe.</p>
        </header>

        <div className="menu-wrap">
          <RevealOnScroll>
            <div className="menu-card">
              {PRICING.map((section, idx) => (
                <div key={idx} className="menu-section">
                  <div className="menu-label">
                    <span className="eyebrow">{section.title}</span>
                  </div>
                  <ul className="menu-list">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="menu-row">
                        <span className="menu-row__name">{item.name}</span>
                        <span className="menu-row__leader"></span>
                        <span className="menu-row__price">
                          {/\d/.test(item.price) ? item.price : <small>{item.price}</small>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {section.note && (
                    <p className="menu-note">
                      <Droplets />
                      <span><strong>{section.note.split(' — ')[0]}</strong> — {section.note.split(' — ').slice(1).join(' — ')}</span>
                    </p>
                  )}
                </div>
              ))}

              <div className="menu-section menu-section--alacarte">
                <div className="menu-label">
                  <span className="eyebrow">À la carte</span>
                </div>
                <div className="alacarte__body">
                  <h3 className="alacarte__title">{ALA_CARTE.title}</h3>
                  <p className="alacarte__desc">{ALA_CARTE.description}</p>
                  <div className="alacarte__price-row">
                    <span className="alacarte__price-label">Cena</span>
                    <span className="alacarte__price-leader"></span>
                    <span className="alacarte__price-value">{ALA_CARTE.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>

        <BookingCTA />
      </main>

      <Footer />
    </>
  );
}
