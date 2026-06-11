'use client';

import { useEffect } from 'react';
import styles from './admin.module.css';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.frame}>
      <div className={styles.shell}>
        <main className={styles.content}>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Chyba backstage</p>
            <h1 className={styles.title}>Niečo sa pokazilo. Skúste obnoviť stránku.</h1>
            <p className={styles.description}>{error.message || 'Nastala chyba pri načítaní admin časti.'}</p>
            <div className={styles.heroActions}>
              <button className="btn btn--primary" type="button" onClick={reset}>
                Obnoviť
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
