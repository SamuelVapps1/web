import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevealOnScroll from '@/components/RevealOnScroll';
import Photo from '@/components/Photo';
import BookingCTA from '@/components/BookingCTA';
import { REVIEWS } from '@/data/reviews';
import { Scissors, Heart, Award, Clock } from 'lucide-react';
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
              <span className="eyebrow">30 ROKOV ZA NOŽNICAMI · PETRŽALKA</span>
            </div>
            <h1 className="hero__title">
              Strih prispôsobený <em>plemenu, srsti aj povahe</em> vášho psa.
            </h1>
            <p className="hero__lead lead">
              Salón pre psov v Petržalke. Tridsať rokov skúseností — profesionálna úprava, ktorou váš pes nielen vyzerá, ale aj cíti sa dobre.
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
                <Photo src="" alt="Pes pred úpravou v salóne Laura" width={600} height={700} placeholder="" priority />
                <span className="tag">Pred</span>
              </div>
              <div className="diptych__cell">
                <Photo src="" alt="Pes po úprave v salóne Laura" width={600} height={700} placeholder="" />
                <span className="tag">Po</span>
              </div>
              <div className="badge">
                <span className="badge__star">★</span>
                <span className="badge__top">30 rokov</span>
                <span className="badge__bot">Petržalka</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <RevealOnScroll>
              <div className="sec-head">
                <div className="sec-head__eyebrow">
                  <span className="eyebrow">Prečo Laura</span>
                </div>
                <h2>Skúsenosť, ktorou na psovi vidno</h2>
                <p className="lead">Každý pes je iný — plne to rešpektujeme. Strih prispôsobujeme plemenu, druhu srsti, ale aj povahe a veku vášho psa.</p>
              </div>
            </RevealOnScroll>
            <div className="tiles">
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <Scissors />
                  </div>
                  <h3>Plemenné strihy</h3>
                  <p>Striháme podľa štandardu plemena — alebo podľa vašich predstáv. Máme skúsenosti s rozmanitými plemenami.</p>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <Heart />
                  </div>
                  <h3>Šetrný prístup</h3>
                  <p>Seniori a šteňa dostanú extra pozornosť. Pracujeme v pokojnom tempe, ktorý vášmu psovi vyhovuje.</p>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <Award />
                  </div>
                  <h3>Tridsať rokov praxe</h3>
                  <p>Tisíce psov a takmer každé plemeno. Žiadne učenie sa na tom vašom — istota, ktorú vidno na výsledku.</p>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="tile">
                  <div className="tile__icon">
                    <Clock />
                  </div>
                  <h3>Termín na mieru</h3>
                  <p>Objednajte sa telefonicky — nájdeme vám termín, ktorý vám vyhovuje. Necháme si čas pre vášho psa.</p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        <section className="section section--alt">
          <div className="wrap">
            <RevealOnScroll>
              <div className="sec-head">
                <div className="sec-head__eyebrow">
                  <span className="eyebrow">Pred a po</span>
                </div>
                <h2>Úprava, ktorou na psovi vidno</h2>
                <p className="lead">Pozrite si príklady našej práce — od jednoduchých kúpeľov až po komplexné plemenné strihy.</p>
              </div>
            </RevealOnScroll>
            <div className="transforms">
              <RevealOnScroll>
                <div className="transform">
                  <div className="transform__pair">
                    <div className="transform__cell">
                      <Photo src="" alt="Pred úpravou" width={400} height={290} placeholder="" />
                      <span className="minitag minitag--l">Pred</span>
                    </div>
                    <div className="transform__cell">
                      <Photo src="" alt="Po úprave" width={400} height={290} placeholder="" />
                      <span className="minitag minitag--r">Po</span>
                    </div>
                  </div>
                  <div className="transform__caption">
                    <span className="transform__breed">Kerry blue teriér</span>
                    <span className="transform__case">Silne splstnatená srsť · 2,5 hod</span>
                  </div>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="transform">
                  <div className="transform__pair">
                    <div className="transform__cell">
                      <Photo src="" alt="Pred úpravou" width={400} height={290} placeholder="" />
                      <span className="minitag minitag--l">Pred</span>
                    </div>
                    <div className="transform__cell">
                      <Photo src="" alt="Po úprave" width={400} height={290} placeholder="" />
                      <span className="minitag minitag--r">Po</span>
                    </div>
                  </div>
                  <div className="transform__caption">
                    <span className="transform__breed">Pudel stredný</span>
                    <span className="transform__case">Výstavné strihanie</span>
                  </div>
                </div>
              </RevealOnScroll>
              <RevealOnScroll>
                <div className="transform">
                  <div className="transform__pair">
                    <div className="transform__cell">
                      <Photo src="" alt="Pred úpravou" width={400} height={290} placeholder="" />
                      <span className="minitag minitag--l">Pred</span>
                    </div>
                    <div className="transform__cell">
                      <Photo src="" alt="Po úprave" width={400} height={290} placeholder="" />
                      <span className="minitag minitag--r">Po</span>
                    </div>
                  </div>
                  <div className="transform__caption">
                    <span className="transform__breed">Jorkšírsky teriér, 14 r.</span>
                    <span className="transform__case">Senior pes · šetrné tempo</span>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
            <div className="gallery-cta">
              <Link className="btn btn--ghost" href="/galeria">
                Pozrieť celú galériu
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <RevealOnScroll>
              <div className="about">
                <div className="about__media">
                  <Photo src="" alt="Laura v salóne" width={600} height={500} placeholder="" />
                </div>
                <div className="about__body">
                  <h2>Tridsať rokov za jedným stolom</h2>
                  <p className="about__lead lead">
                    Žiadne striedanie personálu — tie isté ruky, ktoré poznajú takmer každé plemeno aj každú náladu.
                  </p>
                  <div className="about__stats">
                    <div className="about__stat">
                      <div className="n">30</div>
                      <div className="l">rokov praxe</div>
                    </div>
                    <div className="about__stat">
                      <div className="n">100+</div>
                      <div className="l">recenzií na Google</div>
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

        <section className="section section--alt">
          <div className="wrap">
            <RevealOnScroll>
              <div className="sec-head">
                <div className="sec-head__eyebrow">
                  <span className="eyebrow">Recenzie</span>
                </div>
                <h2>Čo hovoria rodičia psov</h2>
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
