'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, House, ListChecks, UsersRound } from 'lucide-react';
import styles from './admin.module.css';

type NavItem = {
  href: string;
  label: string;
  icon: typeof House;
  badgeKey?: 'pending';
};

const navItems: NavItem[] = [
  { href: '/admin', label: 'Dnes', icon: House },
  { href: '/admin/calendar', label: 'Kalendár', icon: CalendarDays },
  { href: '/admin/reservations', label: 'Žiadosti', icon: ListChecks, badgeKey: 'pending' as const },
  { href: '/admin/customers', label: 'Zákazníci', icon: UsersRound },
];

export default function AdminSidebarNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebarNav} aria-label="Admin navigácia">
      {navItems.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            className={`${styles.sidebarNavItem} ${active ? styles.sidebarNavItemActive : ''}`}
            href={item.href}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.sidebarNavIcon} aria-hidden="true">
              <Icon size={18} strokeWidth={1.9} />
            </span>
            <span className={styles.sidebarNavLabel}>{item.label}</span>
            {item.badgeKey === 'pending' && pendingCount > 0 ? (
              <span className={styles.sidebarNavBadge}>{pendingCount}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
