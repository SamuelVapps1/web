import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from '../diary.module.css';

type DiaryShellProps = {
  view: 'week' | 'day' | 'list';
  dateKey: string;
  errorMessage: string | null;
  children: ReactNode;
  sidebar: ReactNode;
  rangeLabel: string;
};

function viewUrl(view: 'week' | 'day' | 'list', dateKey: string): string {
  const params = new URLSearchParams({ view, date: dateKey });
  return `/diar?${params.toString()}`;
}

export default function DiaryShell({ view, dateKey, errorMessage, children, sidebar, rangeLabel }: DiaryShellProps) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <h1>Diár</h1>
          <p className={styles.subtitle}>{rangeLabel}</p>
        </div>
      </section>

      <section className={styles.shell}>
        <div className={styles.mainPanel}>
          <div className={styles.panelInner}>
            <div className={styles.tabs}>
              {[
                ['week', 'Týždeň'],
                ['day', 'Deň'],
                ['list', 'Zoznam'],
              ].map(([tabView, label]) => (
                <Link
                  key={tabView}
                  href={viewUrl(tabView as 'week' | 'day' | 'list', dateKey)}
                  className={`${styles.tabLink} ${view === tabView ? styles.tabLinkActive : ''}`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {errorMessage ? (
              <div className={`${styles.banner} ${styles.bannerError}`}>{errorMessage}</div>
            ) : null}

            {children}
          </div>
        </div>

        <aside className={styles.sidePanel}>
          <div className={styles.panelInner}>{sidebar}</div>
        </aside>
      </section>
    </>
  );
}
