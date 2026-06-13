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
    dogs: { id: string; name: string; breed: string | null; size: string; sizeLabel: string }[];
    reservationCount: number;
    lastVisitLabel: string;
  }[];
}) {
  const [query, setQuery] = useState('');
  const totalDogs = customers.reduce((sum, customer) => sum + customer.dogs.length, 0);
  const totalReservations = customers.reduce((sum, customer) => sum + customer.reservationCount, 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return customers;
    }

    return customers.filter((customer) => {
      const tags = customer.tags ?? [];
      const haystack = [customer.name, customer.phone, ...tags, ...customer.dogs.map((dog) => dog.name)]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [query, customers]);

  return (
    <div className={styles.customerSearchLayout}>
      <section className={styles.customerDirectoryHero}>
        <div className={styles.customerDirectoryHeroCopy}>
          <p className={styles.eyebrow}>Zákazníci</p>
          <h1 className={styles.pageTitle}>Kontakty, psy a história</h1>
          <p className={styles.pageLead}>Vyhľadaj meno, telefón alebo psa a otvor profil bez zbytočného šumu.</p>
        </div>

        <div className={styles.customerDirectoryStats}>
          <div>
            <strong>{customers.length}</strong>
            <span>zákazníkov</span>
          </div>
          <div>
            <strong>{totalDogs}</strong>
            <span>psov</span>
          </div>
          <div>
            <strong>{totalReservations}</strong>
            <span>rezervácií</span>
          </div>
        </div>

        <div className={styles.customerDirectorySearch}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Meno, telefón, tag alebo pes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Link className="btn btn--ghost" href="/admin/customers/new">
            + Nový zákazník
          </Link>
        </div>
      </section>

      <div className={styles.customerList}>
        {filtered.length > 0 ? (
          filtered.map((customer) => (
            <Link key={customer.id} className={styles.customerCard} href={`/admin/customers/${customer.id}`}>
              <div className={styles.customerCardTop}>
                <strong>{customer.name}</strong>
                <span>{customer.phone}</span>
              </div>
              <p className={styles.customerTagSummary}>{getCustomerTagSummary(customer.tags ?? [])}</p>
              <p>{customer.dogs.map((dog) => `${dog.name} · ${dog.sizeLabel}`).join(', ') || 'Bez psov'}</p>
              <p>
                {customer.reservationCount} rezervácií · {customer.lastVisitLabel}
              </p>
            </Link>
          ))
        ) : (
          <p className={styles.emptyState}>Zatiaľ žiadni zákazníci.</p>
        )}
      </div>
    </div>
  );
}
