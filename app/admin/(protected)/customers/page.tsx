export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../admin.module.css';
import { listAdminCustomers } from '@/lib/admin-data';
import CustomerSearchClient from './customer-search-client';
import { createCustomer } from '@/app/admin/actions';

async function submitCreateCustomer(formData: FormData) {
  'use server';
  await createCustomer(formData);
}

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();

  return (
    <div className={styles.customersPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Zákazníci</p>
          <h1 className={styles.pageTitle}>Kontakty, psy a história</h1>
          <p className={styles.pageLead}>Vyhľadajte meno, telefón alebo psa a otvorte profil.</p>
        </div>
        <div className={styles.heroActions}>
          <Link className="btn btn--ghost" href="/admin/reservations/new">
            + Nová rezervácia
          </Link>
        </div>
      </section>

      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>Nový zákazník</p>
        <form action={submitCreateCustomer} className={styles.formGrid}>
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
          <button className="btn btn--primary" type="submit">
            Pridať zákazníka
          </button>
        </form>
      </section>

      <CustomerSearchClient customers={customers} />
    </div>
  );
}
