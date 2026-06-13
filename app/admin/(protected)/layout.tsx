import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { requireAdminUser } from '@/lib/admin-session';
import AdminSidebarNav from '../admin-sidebar-nav';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminUser();

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

          <AdminSidebarNav />
        </aside>

        <div className={styles.workspace}>
          <main className={styles.workspaceContent}>{children}</main>
        </div>
      </div>
    </div>
  );
}
