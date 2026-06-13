import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Ochrana osobných údajov',
  description:
    'Informácie o spracúvaní osobných údajov pri rezervácii termínu v salóne Laura.',
  alternates: { canonical: '/ochrana-osobnych-udajov' },
};

export default function OchranaOsobnychUdajovPage() {
  return (
    <>
      <Header />

      <main>
        <header className="pagehead">
          <div className="pagehead__eyebrow">
            <span className="eyebrow">GDPR</span>
          </div>
          <h1>Ochrana osobných údajov</h1>
          <p className="lead">
            Vaše osobné údaje spracúvame len v rozsahu potrebnom na vybavenie
            rezervácie, komunikáciu so zákazníkom a vedenie evidencie návštev.
          </p>
        </header>

        <section className="section">
          <div className="wrap wrap--narrow">
            <div className="story" style={{ gridTemplateColumns: '1fr' }}>
              <div className="story__body">
                <hr className="story__rule rule-brass" />
                <p>
                  Prevádzkovateľom webu a spracovateľom osobných údajov je Laura
                  salón pre psov, Osuského 7, 851 03 Bratislava-Petržalka,
                  telefón: <a href="tel:+421944240116">+421 944 240 116</a>.
                </p>
                <p>
                  Pri online rezervácii môžeme spracúvať najmä meno a kontaktné
                  údaje majiteľa, údaje potrebné na potvrdenie termínu a
                  základné informácie o psovi, ktoré sú potrebné na poskytnutie
                  služby.
                </p>
                <p>
                  Vaše osobné údaje nepredávame tretím stranám a
                  nesprístupňujeme ich na marketingové účely iným subjektom.
                  Údaje môžu byť spracúvané len v nevyhnutnom rozsahu
                  overenými technickými a hostingovými poskytovateľmi, ktorí
                  zabezpečujú prevádzku webu a rezervačného systému.
                </p>
                <p>
                  Právnym základom spracúvania je vybavenie vašej rezervácie,
                  komunikácia pred poskytnutím služby a plnenie súvisiacich
                  zákonných povinností. Údaje uchovávame len po dobu nevyhnutnú
                  na tento účel a na ochranu oprávnených záujmov prevádzkovateľa.
                </p>
                <p>
                  Máte právo požiadať o prístup k svojim osobným údajom, ich
                  opravu, vymazanie, obmedzenie spracúvania alebo namietať proti
                  spracúvaniu, ak to pripúšťa príslušná právna úprava. Svoju
                  požiadavku nám môžete oznámiť telefonicky alebo pri osobnom
                  kontakte.
                </p>
                <p>
                  Ak sa domnievate, že s osobnými údajmi nenakladáme v súlade s
                  právnymi predpismi, máte právo podať podnet na Úrad na ochranu
                  osobných údajov Slovenskej republiky.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
