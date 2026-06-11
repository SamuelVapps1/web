'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from '../../admin.module.css';
import { getCustomerTagSummary } from '@/lib/admin-domain';

export default function CustomerSearchClient({
  customers,
}: {
  customers: {
    id: string;
    name: string;
    phone: string;
    tags: string[];
    dogs: { id: string; name: string; breed: string | null; size: string }[];
    reservationCount: number;
    lastVisitLabel: string;
  }[];
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return customers;
    }

    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.phone,
        ...customer.tags,
        ...customer.dogs.map((dog) => dog.name),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [query, customers]);

  return (
    <div className={styles.customerSearchLayout}>
      <input
        className={styles.searchInput}
        type="search"
        placeholder="Meno, telefón, tag alebo pes"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className={styles.customerList}>
        {filtered.length > 0 ? (
          filtered.map((customer) => (
            <Link key={customer.id} className={styles.customerCard} href={`/admin/customers/${customer.id}`}>
              <div className={styles.customerCardTop}>
                <strong>{customer.name}</strong>
                <span>{customer.phone}</span>
              </div>
              <p className={styles.customerTagSummary}>{getCustomerTagSummary(customer.tags)}</p>
              <p>{customer.dogs.map((dog) => dog.name).join(', ') || 'Bez psov'}</p>
              <p>{customer.reservationCount} rezervácií · {customer.lastVisitLabel}</p>
            </Link>
          ))
        ) : (
          <p className={styles.emptyState}>Zatiaľ žiadni zákazníci.</p>
        )}
      </div>
    </div>
  );
}
