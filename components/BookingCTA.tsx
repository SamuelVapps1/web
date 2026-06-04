'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BookingCTAProps {
  showReservacia?: boolean;
}

export default function BookingCTA({ showReservacia = false }: BookingCTAProps) {
  const pathname = usePathname();
  const isContactPage = pathname === '/kontakt';

  return (
    <section className="section section--alt">
      <div className="wrap wrap--narrow closing">
        <hr className="rule-brass" style={{ width: '60px', margin: '0 auto 2rem' }} />
        <h2>Objednať sa</h2>
        <p className="lead">Zavolajte, poradíme a nájdeme vyhovujúci termín.</p>
        <div className="closing__cta">
          {isContactPage ? (
            <a className="btn btn--primary" href="tel:+421944240116">Objednať sa</a>
          ) : (
            <Link className="btn btn--primary" href="/kontakt">Objednať sa</Link>
          )}
          {showReservacia && (
            <Link className="btn btn--ghost" href="/rezervacia">Rezervovať termín</Link>
          )}
        </div>
      </div>
    </section>
  );
}
