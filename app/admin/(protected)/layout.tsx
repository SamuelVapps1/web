import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { getAdminDashboardData } from '@/lib/admin-data';
import { requireAdminUser } from '@/lib/admin-session';
import { LogoutButton } from '../logout-button';
import AdminSidebarNav from '../admin-sidebar-nav';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminUser();
  const dashboard = await getAdminDashboardData();

  return (
    <div className={styles.frame}>
      <div className={styles.adminShell}>
        <aside className={styles.sidebar}>
          <Link className={styles.brandLink} href="/admin" aria-label="Laura salón pre psov">
            <div className={styles.brand}>
              <div className={styles.brand__title}>Laura</div>
              <div className={styles.brand__sub}>Salón pre psov</div>
            </div>
          </Link>

          <AdminSidebarNav pendingCount={dashboard.pendingCount} />

          <div className={styles.sidebarFooter}>
            <div className={styles.sidebarMetaCard}>
              <p className={styles.sidebarMetaLabel}>Prevádzka</p>
              <p className={styles.sidebarMetaValue}>Po – Pia 10:00 – 13:00 · 14:00 – 18:00</p>
              <p className={`${styles.sidebarMetaValue} ${styles.phoneInline}`}>+421 944 240 116</p>
            </div>

            <div className={styles.userCard}>
              <div className={styles.userAvatar} aria-hidden="true">
                L
              </div>
              <div className={styles.userCopy}>
                <strong>Eva</strong>
                <span>{user.email ?? user.id}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className={styles.workspace}>
          <main className={styles.workspaceContent}>{children}</main>

          <footer className={styles.workspaceFooter}>
            <div className={styles.workspaceFooterBrand}>
              <span className={styles.workspaceFooterMark} aria-hidden="true">
                ✦
              </span>
              <span>Laura salón pre psov</span>
              <span>Petržalka</span>
              <span className={styles.phoneInline}>+421 944 240 116</span>
              <span>info@laurasalon.sk</span>
            </div>

            <div className={styles.workspaceFooterStatus}>
              <span>Verzia 1.0.0</span>
              <span className={styles.statusDot} aria-hidden="true" />
              <span>Všetko aktuálne</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
