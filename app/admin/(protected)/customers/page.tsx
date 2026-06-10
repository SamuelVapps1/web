export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../admin.module.css';
import { listAdminCustomers } from '@/lib/admin-data';
import CustomerSearchClient from './customer-search-client';
import NewCustomerForm from './new-customer-form';

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

      <NewCustomerForm />

      <CustomerSearchClient customers={customers} />
    </div>
  );
}
