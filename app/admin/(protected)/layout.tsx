import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogoutButton } from '../logout-button';
import styles from '../admin.module.css';
import { requireAdminUser } from '@/lib/admin-session';

const navItems = [
  { href: '/admin/calendar', label: 'Kalendár' },
  { href: '/admin/reservations', label: 'Rezervácie' },
  { href: '/admin/customers', label: 'Zákazníci' },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminUser();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brand__title}>Backstage</div>
          <div className={styles.brand__sub}>Admin pre salón</div>
        </div>

        <nav className={styles.nav} aria-label="Admin navigácia">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={styles.nav__link}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
          <span className={styles.nav__spacer} aria-hidden="true" />
          <LogoutButton />
        </nav>
      </header>

      <main className={styles.content}>
        {children}
        <p style={{ marginTop: '1rem', color: '#4a443c', fontSize: '0.92rem' }}>
          Prihlásený účet: {user.email ?? user.id}
        </p>
      </main>
    </div>
  );
}
