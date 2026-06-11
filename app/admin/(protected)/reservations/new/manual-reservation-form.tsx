'use client';

import Link from 'next/link';
import { useMemo, useState, useActionState } from 'react';
import styles from '../../../admin.module.css';
import { createManualReservation, type AdminActionState } from '@/app/admin/actions';
import { BOOKING_ADDONS, BOOKING_CUT_TYPES } from '@/lib/booking';

const initialState: AdminActionState = { kind: 'idle' };

export default function ManualReservationForm({
  customers,
  initialDate,
  initialTime,
}: {
  customers: {
    id: string;
    name: string;
    phone: string;
    dogs: { id: string; name: string; breed: string | null; size: string; sizeLabel: string }[];
  }[];
  initialDate?: string;
  initialTime?: string;
}) {
  const [state, action, pending] = useActionState(createManualReservation, initialState);
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedDogId, setSelectedDogId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState('');
  const [selectedCustomerNote, setSelectedCustomerNote] = useState('');
  const [selectedDogName, setSelectedDogName] = useState('');
  const [selectedDogBreed, setSelectedDogBreed] = useState('');
  const [selectedDogSize, setSelectedDogSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM');
  const [selectedTemperamentNote, setSelectedTemperamentNote] = useState('');
  const [selectedHealthNote, setSelectedHealthNote] = useState('');
  const [selectedCutType, setSelectedCutType] = useState('ADVICE');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate ?? '');
  const [selectedTime, setSelectedTime] = useState(initialTime ?? '');
  const [selectedDuration, setSelectedDuration] = useState(90);
  const [internalNote, setInternalNote] = useState('');

  const filteredCustomers = useMemo(() => {
    const normalized = customerQuery.trim().toLowerCase();
    if (!normalized) {
      return customers;
    }

    return customers.filter((customer) => {
      const haystack = [
        customer.name,
        customer.phone,
        ...customer.dogs.map((dog) => dog.name),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [customerQuery, customers]);

  function selectCustomer(customer: (typeof customers)[number]) {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerName(customer.name);
    setSelectedCustomerPhone(customer.phone);
    setSelectedDogId('');
    setSelectedDogName('');
    setSelectedDogBreed('');
    setSelectedDogSize('MEDIUM');
    setSelectedTemperamentNote('');
    setSelectedHealthNote('');
  }

  function selectDog(dog: { id: string; name: string; breed: string | null; size: string; sizeLabel: string }) {
    setSelectedDogId(dog.id);
    setSelectedDogName(dog.name);
    setSelectedDogBreed(dog.breed ?? '');
    setSelectedDogSize(dog.size as 'SMALL' | 'MEDIUM' | 'LARGE');
  }

  return (
    <div className={styles.manualLayout}>
      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>1. Zákazník</p>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Hľadať meno alebo telefón"
          value={customerQuery}
          onChange={(event) => setCustomerQuery(event.target.value)}
        />
        <div className={styles.searchList}>
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              className={`${styles.searchCard} ${selectedCustomerId === customer.id ? styles.searchCardActive : ''}`}
              onClick={() => selectCustomer(customer)}
            >
              <strong>{customer.name}</strong>
              <span>{customer.phone}</span>
            </button>
          ))}
        </div>

        <div className={styles.formGrid}>
          <input type="hidden" name="customerId" value={selectedCustomerId} />
          <div className={styles.field}>
            <label>Meno zákazníka</label>
            <input value={selectedCustomerName} onChange={(event) => setSelectedCustomerName(event.target.value)} name="customerName" />
          </div>
          <div className={styles.field}>
            <label>Telefón</label>
            <input value={selectedCustomerPhone} onChange={(event) => setSelectedCustomerPhone(event.target.value)} name="customerPhone" />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input value={selectedCustomerEmail} onChange={(event) => setSelectedCustomerEmail(event.target.value)} name="customerEmail" />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Poznámka</label>
            <textarea value={selectedCustomerNote} onChange={(event) => setSelectedCustomerNote(event.target.value)} name="customerNote" />
          </div>
        </div>
      </section>

      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>2. Pes</p>
        {selectedCustomerId ? (
          <div className={styles.searchList}>
            {customers
              .find((customer) => customer.id === selectedCustomerId)
              ?.dogs.map((dog) => (
                <button
                  key={dog.id}
                  type="button"
                  className={`${styles.searchCard} ${selectedDogId === dog.id ? styles.searchCardActive : ''}`}
                  onClick={() => selectDog(dog)}
                >
                  <strong>{dog.name}</strong>
                  <span>{dog.breed ?? 'Bez plemena'} · {dog.sizeLabel}</span>
                </button>
              ))}
          </div>
        ) : null}

        <div className={styles.formGrid}>
          <input type="hidden" name="dogId" value={selectedDogId} />
          <div className={styles.field}>
            <label>Meno psa</label>
            <input value={selectedDogName} onChange={(event) => setSelectedDogName(event.target.value)} name="dogName" />
          </div>
          <div className={styles.field}>
            <label>Plemeno</label>
            <input value={selectedDogBreed} onChange={(event) => setSelectedDogBreed(event.target.value)} name="dogBreed" />
          </div>
          <div className={styles.field}>
            <label>Veľkosť</label>
            <select value={selectedDogSize} onChange={(event) => setSelectedDogSize(event.target.value as 'SMALL' | 'MEDIUM' | 'LARGE')} name="dogSize">
              <option value="SMALL">Malý</option>
              <option value="MEDIUM">Stredný</option>
              <option value="LARGE">Veľký</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Strih</label>
            <select value={selectedCutType} onChange={(event) => setSelectedCutType(event.target.value)} name="cutType">
              {BOOKING_CUT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Povaha</label>
            <textarea value={selectedTemperamentNote} onChange={(event) => setSelectedTemperamentNote(event.target.value)} name="temperamentNote" />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Zdravie</label>
            <textarea value={selectedHealthNote} onChange={(event) => setSelectedHealthNote(event.target.value)} name="healthNote" />
          </div>
        </div>
      </section>

      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>3. Termín</p>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Dátum</label>
            <input type="date" name="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Čas</label>
            <input type="time" name="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Trvanie</label>
            <select name="durationMin" value={selectedDuration} onChange={(event) => setSelectedDuration(Number(event.target.value))}>
              {[30, 60, 90, 120, 150, 180, 210, 240].map((value) => (
                <option key={value} value={value}>
                  {value} min
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label>Interná poznámka</label>
            <textarea name="internalNote" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
          </div>
        </div>
      </section>

      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>4. Doplnky</p>
        <div className={styles.checkboxGrid}>
          {BOOKING_ADDONS.map((addon) => {
            const active = selectedServices.includes(addon.code);
            return (
              <label key={addon.code} className={`${styles.checkboxCard} ${active ? styles.checkboxCardActive : ''}`}>
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={addon.code}
                  checked={active}
                  onChange={() => {
                    setSelectedServices((current) =>
                      current.includes(addon.code)
                        ? current.filter((value) => value !== addon.code)
                        : [...current, addon.code],
                    );
                  }}
                />
                <strong>{addon.label}</strong>
                <span>{addon.note}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className={styles.detailCard}>
        {state.kind !== 'idle' ? (
          <div className={`${styles.stateBanner} ${state.kind === 'error' ? styles.stateBannerError : state.kind === 'warning' ? styles.stateBannerWarning : styles.stateBannerSuccess}`}>
            <p className={styles.stateBannerTitle}>{state.kind === 'error' ? 'Nepodarilo sa uložiť' : state.kind === 'warning' ? 'Uložené s upozornením' : 'Uložené'}</p>
            <p>{state.message}</p>
            {'link' in state && state.link ? (
              <Link className="btn btn--ghost" href={state.link.href}>
                {state.link.label}
              </Link>
            ) : null}
            {state.kind === 'warning' && state.collisions.length > 0 ? (
              <ul className={styles.stateCollisionList}>
                {state.collisions.map((collision) => (
                  <li key={collision.id}>
                    {collision.start} - {collision.end} · {collision.customerName} / {collision.dogName}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <form action={action} className={styles.manualSubmitForm}>
          <input type="hidden" name="customerId" value={selectedCustomerId} />
          <input type="hidden" name="customerName" value={selectedCustomerName} />
          <input type="hidden" name="customerPhone" value={selectedCustomerPhone} />
          <input type="hidden" name="customerEmail" value={selectedCustomerEmail} />
          <input type="hidden" name="customerNote" value={selectedCustomerNote} />
          <input type="hidden" name="dogId" value={selectedDogId} />
          <input type="hidden" name="dogName" value={selectedDogName} />
          <input type="hidden" name="dogBreed" value={selectedDogBreed} />
          <input type="hidden" name="dogSize" value={selectedDogSize} />
          <input type="hidden" name="temperamentNote" value={selectedTemperamentNote} />
          <input type="hidden" name="healthNote" value={selectedHealthNote} />
          <input type="hidden" name="cutType" value={selectedCutType} />
          {selectedServices.map((serviceId) => (
            <input key={serviceId} type="hidden" name="serviceIds" value={serviceId} />
          ))}
          <input type="hidden" name="date" value={selectedDate} />
          <input type="hidden" name="time" value={selectedTime} />
          <input type="hidden" name="durationMin" value={selectedDuration} />
          <input type="hidden" name="internalNote" value={internalNote} />
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? 'Ukladám...' : 'Uložiť ako potvrdenú'}
          </button>
        </form>
      </section>
    </div>
  );
}
