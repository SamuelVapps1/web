import { MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  return (
    <footer className={`footer ${className || ''}`}>
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <Link className="wordmark" href="/">
              <span className="wordmark__name">Laura</span>
              <span className="wordmark__sub">salón pre psov</span>
            </Link>
            <p className="footer__tag">Salón pre psov v Petržalke. Tridsať rokov za nožnicami — skúsenosť, ktorú na psovi vidno.</p>
          </div>
          <div>
            <h4>Salón</h4>
            <ul className="footer__list">
              <li><Link href="/cennik">Cenník</Link></li>
              <li><Link href="/galeria">Galéria</Link></li>
              <li><Link href="/o-nas">O nás</Link></li>
            </ul>
          </div>
          <div>
            <h4>Hodiny</h4>
            <ul className="footer__list">
              <li>Po – Pia · 10:00 – 13:00 a 14:00 – 18:00</li>
              <li>Sobota – Nedeľa · zatvorené</li>
            </ul>
          </div>
          <div>
            <h4>Kontakt</h4>
            <ul className="footer__list">
              <li className="footer__contact">
                <MapPin />
                <span>Osuského 7, 851 03 Bratislava-Petržalka</span>
              </li>
              <li className="footer__contact">
                <Phone />
                <a href="tel:+421944240116">+421 944 240 116</a>
              </li>
              <li className="footer__contact">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--brass-soft)', marginTop: '3px', flex: 'none' }}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <a href="https://www.instagram.com/laura_salon_pre_psov/" target="_blank" rel="noopener noreferrer">@laura_salon_pre_psov</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 Laura salón pre psov</span>
          <span>laurasalon.sk</span>
        </div>
      </div>
    </footer>
  );
}
