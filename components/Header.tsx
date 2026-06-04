'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const isContactPage = pathname === '/kontakt';

  return (
    <>
      <header className="topbar">
        <Link className="wordmark" href="/">
          <span className="wordmark__name">Laura</span>
          <span className="wordmark__sub">salón pre psov</span>
        </Link>
        <nav className="nav">
          <Link className={`nav__link ${pathname === '/galeria' ? 'is-active' : ''}`} href="/galeria">Galéria</Link>
          <Link className={`nav__link ${pathname === '/cennik' ? 'is-active' : ''}`} href="/cennik">Cenník</Link>
          <Link className={`nav__link ${pathname === '/o-nas' ? 'is-active' : ''}`} href="/o-nas">O nás</Link>
          <Link className={`nav__link ${pathname === '/kontakt' ? 'is-active' : ''}`} href="/kontakt">Kontakt</Link>
          <span className="nav__sep"></span>
          <a className="nav__tel" href="tel:+421944240116">+421 944 240 116</a>
          {isContactPage ? (
            <a className="btn btn--primary" href="tel:+421944240116">Objednať sa</a>
          ) : (
            <Link className="btn btn--primary" href="/kontakt">Objednať sa</Link>
          )}
        </nav>
      </header>

      {/* Mobile sticky booking bar */}
      <div className="stickybook">
        <a className="btn btn--ghost stickybook__call" href="tel:+421944240116" aria-label="Zavolať na +421 944 240 116">
          <Phone style={{ width: 18, height: 18 }} aria-hidden="true" />
        </a>
        {isContactPage ? (
          <a className="btn btn--primary" href="tel:+421944240116">Objednať sa</a>
        ) : (
          <Link className="btn btn--primary" href="/kontakt">Objednať sa</Link>
        )}
      </div>
    </>
  );
}
