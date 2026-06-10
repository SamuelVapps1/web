'use client';

import { useActionState } from 'react';
import styles from '../../admin.module.css';
import { createCustomer, type AdminActionState } from '@/app/admin/actions';

const initialState: AdminActionState = { kind: 'idle' };

export default function NewCustomerForm() {
  const [state, action, pending] = useActionState(createCustomer, initialState);

  return (
    <section className={styles.detailCard}>
      <p className={styles.sectionKicker}>Nový zákazník</p>
      {state.kind !== 'idle' ? (
        <div className={`${styles.stateBanner} ${state.kind === 'error' ? styles.stateBannerError : styles.stateBannerSuccess}`}>
          <p className={styles.stateBannerTitle}>{state.kind === 'error' ? 'Nepodarilo sa uložiť' : 'Uložené'}</p>
          <p>{state.message}</p>
        </div>
      ) : null}
      <form action={action} className={styles.formGrid}>
        <div className={styles.field}>
          <label>Meno</label>
          <input name="name" />
        </div>
        <div className={styles.field}>
          <label>Telefón</label>
          <input name="phone" />
        </div>
        <div className={styles.field}>
          <label>Email</label>
          <input name="email" />
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label>Poznámka</label>
          <textarea name="note" />
        </div>
        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? 'Ukladám...' : 'Pridať zákazníka'}
        </button>
      </form>
    </section>
  );
}
