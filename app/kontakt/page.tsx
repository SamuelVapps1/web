import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RevealOnScroll from '@/components/RevealOnScroll';
import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Sme v Petržalke, Osuského 7. Termín si dohodnite telefonicky na +421 944 240 116. Po–Pia 10:00–13:00 a 14:00–18:00.',
  alternates: { canonical: '/kontakt' },
};

export default function Kontakt() {
  return (
    <>
      <Header />

      <main>
        <header className="pagehead">
          <div className="pagehead__eyebrow">
            <span className="eyebrow">Kontakt</span>
          </div>
          <h1>Kontakt</h1>
          <p className="lead">Sme v Petržalke. Termín si dohodnite telefonicky — radi poradíme.</p>
        </header>

        <div className="wrap" style={{ paddingBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
            }}
          >
            <a className="btn btn--primary btn--full" href="tel:+421944240116">
              Objednať sa telefonicky
            </a>
            <Link className="btn btn--ghost" href="/rezervacia">
              Rezervovať termín
            </Link>
          </div>
        </div>

        <div className="wrap">
          <RevealOnScroll>
            <div className="contact">
              <div className="contact__info">
                <div className="cline">
                  <div className="cline__icon">
                    <Phone />
                  </div>
                  <div>
                    <div className="cline__label">Telefón</div>
                    <div className="cline__value">
                      <a href="tel:+421944240116">+421 944 240 116</a>
                    </div>
                    <div className="cline__sub">Zavolajte a dohodneme termín.</div>
                  </div>
                </div>

                <div className="cline">
                  <div className="cline__icon">
                    <Clock />
                  </div>
                  <div>
                    <div className="cline__label">Otváracie hodiny</div>
                    <div className="cline__value">
                      Po – Pia · 10:00 – 13:00 a 14:00 – 18:00
                    </div>
                    <div className="cline__sub">
                      Sobota – Nedeľa · zatvorené
                    </div>
                  </div>
                </div>

                <div className="cline">
                  <div className="cline__icon">
                    <MapPin />
                  </div>
                  <div>
                    <div className="cline__label">Adresa</div>
                    <div className="cline__value">
                      Osuského 7
                    </div>
                    <div className="cline__sub">
                      851 03 Bratislava-Petržalka
                    </div>
                  </div>
                </div>

              </div>

              <div className="contact__map">
                <iframe
                  src="https://www.google.com/maps?q=Osu%C5%A1k%C3%A9ho%207,%20851%2003%20Bratislava-Petr%C5%BEalka&output=embed"
                  title="Mapa — Osuského 7, Bratislava-Petržalka"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </RevealOnScroll>

          <section className="section">
            <RevealOnScroll>
              <div className="prep__head">
                <div className="sec-head__eyebrow">
                  <span className="eyebrow">Pred návštevou</span>
                </div>
                <h2>Predtým než sa objednáte</h2>
                <p>Pár vecí, aby ste s návštevou u nás a výsledkom úpravy boli spokojní.</p>
              </div>
            </RevealOnScroll>
            <ul className="preplist">
              <RevealOnScroll>
                <li className="prep">
                  <div className="prep__num">01</div>
                  <div className="prep__text">
                    <h3>Objednajte sa vopred</h3>
                    <p>Termín si dohodnite telefonicky. Bez objednania nevieme zaručiť voľný čas.</p>
                  </div>
                </li>
              </RevealOnScroll>
              <RevealOnScroll>
                <li className="prep">
                  <div className="prep__num">02</div>
                  <div className="prep__text">
                    <h3>Psa pred návštevou vyvenčite</h3>
                    <p>Prejde sa, odbaví potreby a do salóna príde pokojnejší.</p>
                  </div>
                </li>
              </RevealOnScroll>
              <RevealOnScroll>
                <li className="prep">
                  <div className="prep__num">03</div>
                  <div className="prep__text">
                    <h3>Povedzte nám o psovi</h3>
                    <p>Zdravotný stav, kožné problémy aj povaha — strach či reaktivita. Dostatok informácií nám pomôže pri práci.</p>
                  </div>
                </li>
              </RevealOnScroll>
              <RevealOnScroll>
                <li className="prep prep--wide">
                  <div className="prep__num">04</div>
                  <div className="prep__text">
                    <h3>Pri silne splstnatenej srsti volíme to, čo psa nebolí</h3>
                    <p>Nie vždy sa dá srsť rozčesať bez toho, aby to psa bolelo. V takom prípade po vzájomnej dohode volíme kratší strih.</p>
                  </div>
                </li>
              </RevealOnScroll>
            </ul>
          </section>
        </div>

      </main>

      <Footer />
    </>
  );
}
