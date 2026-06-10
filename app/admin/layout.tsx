import type { ReactNode } from 'react';
import styles from './admin.module.css';

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className={styles.frame}>{children}</div>;
}
