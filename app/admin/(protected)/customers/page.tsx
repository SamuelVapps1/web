export const dynamic = 'force-dynamic';

import styles from '../../admin.module.css';
import { listAdminCustomers } from '@/lib/admin-data';
import CustomerSearchClient from './customer-search-client';

export default async function AdminCustomersPage() {
  const customers = await listAdminCustomers();

  return (
    <div className={styles.customersPage}>
      <CustomerSearchClient customers={customers} />
    </div>
  );
}
