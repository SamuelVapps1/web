export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../../admin.module.css';
import CustomerCreateForm from './customer-create-form';

export default function AdminCustomerNewPage() {
  return (
    <div className={styles.customerDetailPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Zákazníci</p>
          <h1 className={styles.pageTitle}>Nový zákazník</h1>
          <p className={styles.pageLead}>Zadajte kontakt a pridajte jedného alebo viacerých psov.</p>
        </div>
        <Link className="btn btn--ghost" href="/admin/customers">
          Späť na zoznam
        </Link>
      </section>

      <CustomerCreateForm />
    </div>
  );
}
