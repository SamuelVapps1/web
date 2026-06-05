import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevealOnScroll from '@/components/RevealOnScroll';
import Photo from '@/components/Photo';
import BookingCTA from '@/components/BookingCTA';
import { galleryAlt, galleryTeaser } from '@/data/gallery';
import { heroAfter, heroBefore, homeStory } from '@/data/site-images';
import { REVIEWS } from '@/data/reviews';
import { Scissors, Feather, Ruler, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Salón pre psov v Petržalke',
  description:
    'Tridsať rokov skúseností s úpravou psov v Petržalke. Strih prispôsobený plemenu, srsti aj povahe vášho psa. 4,6 · 100+ recenzií na Google.',
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <section className="hero">
          <div className="hero__body">
            <div className="hero__eyebrow">
              <span className="eyebrow">30 rokov za nožnicami · Petržalka</span>
            </div>
            <h1 className="hero__title">
              Tridsať rokov skúseností. <em>Vidno to na každom psovi.</em>
            </h1>
            <p className="hero__lead lead">
              Salón pre psov v Petržalke, kde strih prispôsobíme Vášmu psovi — jeho plemenu, srsti aj povahe.
            </p>
            <div className="hero__cta">
              <Link className="btn btn--primary" href="/kontakt">Objednať sa</Link>
              <Link className="btn btn--ghost" href="/galeria">Pozrieť galériu</Link>
            </div>
            <div className="proof">
              <span className="proof__stars" aria-hidden="true">★★★★★</span>
              <span>4,6 · 100+ recenzií na Google</span>
            </div>
          </div>
          <div className="hero__media">
            <div className="diptych">
              <div className="diptych__cell">
                <Photo src={heroBefore} alt="Pes pred úpravou v salóne Laura" width={600} height={700} placeholder="" priority sizes="(max-width: 1060px) 100vw, 50vw" />
                <span className="tag">Predtým</span>
              </div>
              <div className="diptych__cell">
                <Photo src={heroAfter} alt="Pes po úprave v salóne Laura" width={600} height={700} placeholder="" sizes="(max-width: 1060px) 100vw, 50vw" />
                <span className="tag">Potom</span>
              </div>
              <div className="badge">
                <span className="badge__star">★</span>
                <span className="badge__top">30 rokov</span>
                <span className="badge__bot">Petržalka</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--alt">
          <div className="wrap">
            <RevealOnScroll>
              <div className="sec-head">
                <div className="sec-head__eyebrow">
                  <span className="eyebrow">Prečo Laura</span>
                </div>
                <h2>Skúsenosť je nenahraditeľná.</h2>
                <p className="lead">Mladý salón ostrihá psa podľa trendu z Instagramu. Laura psa najprv prečíta — srsť, kožu, povahu — a vie, čo mu sadne. To je rozdiel medzi ostrihaným a dobre upraveným psom.</p>
              </div>
            </RevealOnScroll>
            <div className="tiles">
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <Scissors />
                  </div>
                  <h3>30 rokov praxe</h3>
                  <p>Tisíce psov, takmer každé plemeno. Žiadne učenie sa na tom Vašom.</p>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <Feather />
                  </div>
                  <h3>Šetrné ruky</h3>
                  <p>Istá ruka a tempo podľa psa. Skúsený groomer ho zbytočne nestresuje.</p>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <Ruler />
                  </div>
                  <h3>Strih šitý psovi</h3>
                  <p>Nie podľa fotky z internetu. Podľa toho, čo plemenu a srsti naozaj sadne — a poradíme vám.</p>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <ShieldCheck />
                  </div>
                  <h3>Bez gimmickov</h3>
                  <p>Žiadne farbenie, žiadne trblietky. Len čistá, poctivá úprava.</p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <RevealOnScroll>
              <div className="premeny-head">
                <div className="premeny-head__copy">
                  <div className="sec-head__eyebrow">
                    <span className="eyebrow">Premeny</span>
                  </div>
                  <h2>Rozdiel vidno na prvý pohľad</h2>
                </div>
                <Link className="link-brass" href="/galeria">
                  Celá galéria <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </RevealOnScroll>
            <div className="transforms transforms--editorial">
              {galleryTeaser.map((item) => (
                <RevealOnScroll key={item.id}>
                  <div className="transform transform--editorial">
                    <div className="transform__pair">
                      <div className="transform__cell">
                        <Photo src={item.before} alt={galleryAlt(item)} width={400} height={290} placeholder="" sizes="(max-width: 680px) 100vw, 33vw" />
                        <span className="minitag minitag--l">Pred</span>
                      </div>
                      <div className="transform__cell">
                        <Photo src={item.after} alt={galleryAlt(item)} width={400} height={290} placeholder="" sizes="(max-width: 680px) 100vw, 33vw" />
                        <span className="minitag minitag--r">Po</span>
                      </div>
                    </div>
                    <div className="transform__caption">
                      <span className="transform__breed">{item.breed}</span>
                      <span className="transform__case">{item.case}</span>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
            <RevealOnScroll>
              <div className="cta-band">
                <div className="cta-band__copy">
                  <div className="sec-head__eyebrow">
                    <span className="eyebrow">Dohodnime termín</span>
                  </div>
                  <h2>Povedzte nám o vašom psovi.</h2>
                  <p>Zavolajte, poradíme a nájdeme vyhovujúci termín.</p>
                </div>
                <Link className="btn btn--primary" href="/kontakt">Objednať sa</Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <section className="section section--alt">
          <div className="wrap">
            <RevealOnScroll>
              <div className="about">
                <div className="about__media">
                  <Photo src={homeStory} alt="Laura pri práci v salóne" width={600} height={500} placeholder="" sizes="(max-width: 1060px) 100vw, 50vw" />
                </div>
                <div className="about__body">
                  <div className="about__intro">
                    <div className="sec-head__eyebrow">
                      <span className="eyebrow">Príbeh</span>
                    </div>
                    <p className="about__kicker">Rodinný salón s rukopisom, ktorý sa nemení.</p>
                  </div>
                  <h2>Tridsať rokov za jedným stolom</h2>
                  <p className="about__lead lead">
                    Žiadne franšízy, žiadne striedanie personálu — za tridsať rokov tie isté ruky, ktoré poznajú takmer každé plemeno a každú náladu.
                  </p>
                  <div className="about__stats">
                    <div className="about__stat">
                      <div className="n">30</div>
                      <div className="l">rokov praxe</div>
                    </div>
                    <div className="about__stat">
                      <div className="n">100+</div>
                      <div className="l">recenzií</div>
                    </div>
                    <div className="about__stat">
                      <div className="n">13 r.</div>
                      <div className="l">najvernejší klient</div>
                    </div>
                  </div>
                  <Link className="link-brass" href="/o-nas">
                    O nás
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <RevealOnScroll>
              <div className="reviews-head">
                <div className="reviews-head__copy">
                  <div className="sec-head__eyebrow">
                    <span className="eyebrow">Recenzie</span>
                  </div>
                  <h2>Chodia k nám roky. Niektorí desaťročia.</h2>
                </div>
                <p className="reviews-head__note">Skutočné spätné väzby od ľudí, ktorí sa vracajú pravidelne a odporúčajú nás ďalej.</p>
              </div>
            </RevealOnScroll>
            <div className="reviews">
              {REVIEWS.map((review) => (
                <RevealOnScroll key={review.id}>
                  <div className="review">
                    <span className="review__stars">★★★★★</span>
                    <p className="review__quote">"{review.quote}"</p>
                    <div className="review__meta">
                      <div className="review__avatar">{review.initials}</div>
                      <div>
                        <span className="review__name">{review.name}</span>
                        <br />
                        <span className="review__src">{review.source}</span>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <BookingCTA showReservacia />
      </main>

      <Footer />
    </>
  );
}
