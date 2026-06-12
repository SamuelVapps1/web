'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/galeria', label: 'Galéria' },
  { href: '/cennik', label: 'Cenník' },
  { href: '/o-nas', label: 'O nás' },
  { href: '/kontakt', label: 'Kontakt' },
];

export default function Header() {
  const pathname = usePathname();
  const isContactPage = pathname === '/kontakt';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const bookingHref = isContactPage ? 'tel:+421944240116' : '/kontakt';

  return (
    <header className="site-header">
      <div className="topbar">
        <Link className="wordmark" href="/">
          <span className="wordmark__name">Laura</span>
          <span className="wordmark__sub">salón pre psov</span>
        </Link>
        <nav className="nav" aria-label="Hlavná navigácia">
          <div className="nav__desktop">
            <div className="nav__links">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  className={`nav__link ${pathname === link.href ? 'is-active' : ''}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="nav__actions">
              <a className="nav__tel" href="tel:+421944240116">
                +421 944 240 116
              </a>
              <span className="nav__sep" aria-hidden="true" />
              {isContactPage ? (
                <a className="btn btn--primary" href="tel:+421944240116">
                  Objednať sa
                </a>
              ) : (
                <Link className="btn btn--primary" href="/kontakt">
                  Objednať sa
                </Link>
              )}
            </div>
          </div>
          <button
            type="button"
            className="nav__menuToggle"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? 'Zavrieť menu' : 'Otvoriť menu'}
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </nav>
      </div>
      <div className={`nav__drawer ${isMenuOpen ? 'is-open' : ''}`} id="mobile-nav" aria-hidden={!isMenuOpen}>
        <div className="nav__drawerInner">
          <div className="nav__drawerLinks">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                className={`nav__drawerLink ${pathname === link.href ? 'is-active' : ''}`}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="nav__drawerActions">
            <a className="nav__drawerTel" href="tel:+421944240116">
              <Phone aria-hidden="true" />
              <span>+421 944 240 116</span>
            </a>
            {isContactPage ? (
              <a className="btn btn--primary btn--full" href="tel:+421944240116">
                Objednať sa
              </a>
            ) : (
              <Link className="btn btn--primary btn--full" href={bookingHref}>
                Objednať sa
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
