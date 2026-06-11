'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../../../admin.module.css';
import { BOOKING_ADDONS, BOOKING_CUT_TYPES } from '@/lib/booking';
import { DOG_SIZE_SELECT_OPTIONS } from '@/lib/admin-label-mapping';
import { findCustomerMatches, findDuplicateCustomerByPhone } from './manual-reservation-helpers.js';
import { type AdminActionState } from '@/app/admin/actions';
import ReservationAvailabilityPanel from '../_components/reservation-availability-panel';

export type ManualReservationCustomer = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  note?: string | null;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    size: string;
    sizeLabel: string;
    note?: string | null;
    temperamentNote?: string | null;
    coatType?: string | null;
    healthNote?: string | null;
    groomingNotes?: string | null;
  }[];
};

export type ManualReservationAvailabilityReservation = {
  id: string;
  status: string;
  statusLabel: string;
  requestedStart: string;
  confirmedStart: string | null;
  durationMin: number;
  customerName: string;
  dogName: string;
  customerPhone: string;
};

export type ManualReservationState = {
  customerMode: 'select' | 'new';
  dogMode: 'existing' | 'new';
  selectedCustomerId: string;
  selectedDogId: string;
  customerQuery: string;
  showAllCustomers: boolean;
  customerDraft: {
    name: string;
    phone: string;
    email: string;
    note: string;
  };
  dogDraft: {
    name: string;
    breed: string;
    size: 'SMALL' | 'MEDIUM' | 'LARGE';
    note: string;
    temperamentNote: string;
    coatType: string;
    healthNote: string;
    groomingNotes: string;
  };
  reservationDraft: {
    date: string;
    time: string;
    durationMin: number;
    internalNote: string;
    cutType: string;
    serviceIds: string[];
  };
  availabilityCursor: Date;
};

type CustomerStepProps = {
  customers: ManualReservationCustomer[];
  state: ManualReservationState;
  stateAction: {
    setCustomerMode: (value: 'select' | 'new') => void;
    setSelectedCustomerId: (value: string) => void;
    setSelectedDogId: (value: string) => void;
    setCustomerQuery: (value: string) => void;
    setShowAllCustomers: (value: boolean) => void;
    setCustomerDraft: (value: ManualReservationState['customerDraft']) => void;
    setDogMode: (value: 'existing' | 'new') => void;
    setDogDraft: (value: ManualReservationState['dogDraft']) => void;
  };
};

type DogStepProps = {
  customers: ManualReservationCustomer[];
  state: ManualReservationState;
  stateAction: {
    setDogMode: (value: 'existing' | 'new') => void;
    setSelectedDogId: (value: string) => void;
    setDogDraft: (value: ManualReservationState['dogDraft']) => void;
  };
};

type TimingStepProps = {
  availabilityReservations: ManualReservationAvailabilityReservation[];
  state: ManualReservationState;
  stateAction: {
    setReservationDraft: (value: ManualReservationState['reservationDraft']) => void;
    setAvailabilityCursor: (value: Date) => void;
  };
};

type AddonsStepProps = {
  state: ManualReservationState;
  stateAction: {
    setReservationDraft: (value: ManualReservationState['reservationDraft']) => void;
  };
};

type SubmitPanelProps = {
  state: AdminActionState;
  pending: boolean;
  customerMode: 'select' | 'new';
  dogMode: 'existing' | 'new';
  selectedCustomerId: string;
  selectedDogId: string;
  customerDraft: ManualReservationState['customerDraft'];
  dogDraft: ManualReservationState['dogDraft'];
  reservationDraft: ManualReservationState['reservationDraft'];
};

const EMPTY_CUSTOMER_DRAFT: ManualReservationState['customerDraft'] = {
  name: '',
  phone: '',
  email: '',
  note: '',
};

const EMPTY_DOG_DRAFT: ManualReservationState['dogDraft'] = {
  name: '',
  breed: '',
  size: 'MEDIUM',
  note: '',
  temperamentNote: '',
  coatType: '',
  healthNote: '',
  groomingNotes: '',
};

function setArrayValue<T>(values: T[], value: T, active: boolean): T[] {
  if (active) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

function toCustomerDraft(customer: ManualReservationCustomer): ManualReservationState['customerDraft'] {
  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? '',
    note: customer.note ?? '',
  };
}

function toDogDraft(dog: ManualReservationCustomer['dogs'][number]): ManualReservationState['dogDraft'] {
  return {
    name: dog.name,
    breed: dog.breed ?? '',
    size: dog.size as 'SMALL' | 'MEDIUM' | 'LARGE',
    note: dog.note ?? '',
    temperamentNote: dog.temperamentNote ?? '',
    coatType: dog.coatType ?? '',
    healthNote: dog.healthNote ?? '',
    groomingNotes: dog.groomingNotes ?? '',
  };
}

export function CustomerStep({ customers, state, stateAction }: CustomerStepProps) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [debouncedPhone, setDebouncedPhone] = useState(state.customerDraft.phone);
  const searchRegionRef = useRef<HTMLDivElement | null>(null);
  const { setShowAllCustomers } = stateAction;
  const selectedCustomer = customers.find((customer) => customer.id === state.selectedCustomerId) ?? null;
  const filteredCustomers = useMemo(
    () => findCustomerMatches(customers, state.customerQuery) as ManualReservationCustomer[],
    [customers, state.customerQuery],
  );
  const duplicateCustomer = useMemo(
    () => findDuplicateCustomerByPhone(customers, debouncedPhone) as ManualReservationCustomer | null,
    [customers, debouncedPhone],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedPhone(state.customerDraft.phone);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [state.customerDraft.phone]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRegionRef.current?.contains(event.target as Node)) {
        setShowAllCustomers(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [setShowAllCustomers]);

  function resetCustomerSelection() {
    stateAction.setCustomerMode('select');
    stateAction.setSelectedCustomerId('');
    stateAction.setSelectedDogId('');
    stateAction.setCustomerQuery('');
    stateAction.setShowAllCustomers(false);
    stateAction.setCustomerDraft(EMPTY_CUSTOMER_DRAFT);
    stateAction.setDogMode('new');
    stateAction.setDogDraft(EMPTY_DOG_DRAFT);
    setPhoneTouched(false);
  }

  function applySelectedCustomer(customer: ManualReservationCustomer) {
    stateAction.setCustomerMode('select');
    stateAction.setSelectedCustomerId(customer.id);
    stateAction.setSelectedDogId('');
    stateAction.setCustomerQuery('');
    stateAction.setShowAllCustomers(false);
    stateAction.setCustomerDraft(toCustomerDraft(customer));
    stateAction.setDogMode(customer.dogs.length > 0 ? 'existing' : 'new');
    stateAction.setDogDraft(EMPTY_DOG_DRAFT);
    setPhoneTouched(false);
  }

  const showDropdown =
    !selectedCustomer &&
    state.customerMode !== 'new' &&
    (state.customerQuery.trim().length > 0 || state.showAllCustomers);
  const duplicateMatch =
    state.customerMode === 'new' &&
    phoneTouched &&
    state.customerDraft.phone.trim().length > 0 &&
    duplicateCustomer
      ? duplicateCustomer
      : null;

  if (selectedCustomer && state.customerMode === 'select') {
    return (
      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>1. Zákazník</p>
        <div className={styles.selectedSummaryRow}>
          <div>
            <strong>{selectedCustomer.name}</strong>
            <p className={styles.detailMeta}>{selectedCustomer.phone}</p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={resetCustomerSelection}>
            Zmeniť
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.detailCard}>
      <p className={styles.sectionKicker}>1. Zákazník</p>
      <div className={styles.stackCompact}>
        <div ref={searchRegionRef} className={styles.searchFieldWrap}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Hľadať meno, telefón alebo psa"
            value={state.customerQuery}
            onChange={(event) => {
              stateAction.setCustomerQuery(event.target.value);
              stateAction.setShowAllCustomers(false);
            }}
          />

          {showDropdown ? (
            <div className={styles.searchDropdown} role="listbox" aria-label="Zhodní zákazníci">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className={`${styles.searchRow} ${state.selectedCustomerId === customer.id ? styles.searchRowActive : ''}`}
                    onClick={() => applySelectedCustomer(customer)}
                  >
                    <strong>{customer.name}</strong>
                    <span>
                      {customer.phone}
                      {customer.dogs.length > 0
                        ? ` · ${customer.dogs.map((dog) => dog.name).join(', ')}`
                        : ''}
                    </span>
                  </button>
                ))
              ) : (
                <p className={styles.emptyState}>Nenašli sa žiadne zhody.</p>
              )}
            </div>
          ) : null}
        </div>

        {!state.customerQuery.trim() && state.customerMode !== 'new' ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => stateAction.setShowAllCustomers(!state.showAllCustomers)}
          >
            {state.showAllCustomers ? 'Skryť všetkých' : 'Zobraziť všetkých'}
          </button>
        ) : null}

        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            stateAction.setCustomerMode('new');
            stateAction.setSelectedCustomerId('');
            stateAction.setSelectedDogId('');
            stateAction.setCustomerQuery('');
            stateAction.setShowAllCustomers(false);
            stateAction.setCustomerDraft(EMPTY_CUSTOMER_DRAFT);
            stateAction.setDogMode('new');
            stateAction.setDogDraft(EMPTY_DOG_DRAFT);
            setPhoneTouched(false);
          }}
        >
          + Vytvoriť nového zákazníka
        </button>
      </div>

      {state.customerMode === 'new' ? (
        <div className={styles.newCustomerPanel}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              stateAction.setCustomerMode('select');
              stateAction.setSelectedCustomerId('');
              stateAction.setSelectedDogId('');
              stateAction.setCustomerQuery('');
              stateAction.setShowAllCustomers(false);
              stateAction.setCustomerDraft(EMPTY_CUSTOMER_DRAFT);
              stateAction.setDogMode('new');
              stateAction.setDogDraft(EMPTY_DOG_DRAFT);
              setPhoneTouched(false);
            }}
          >
            Zavrieť nový kontakt
          </button>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Meno</label>
              <input
                name="customerName"
                value={state.customerDraft.name}
                onChange={(event) =>
                  stateAction.setCustomerDraft({
                    ...state.customerDraft,
                    name: event.target.value,
                  })
                }
              />
            </div>
            <div className={styles.field}>
              <label>Telefón</label>
              <input
                name="customerPhone"
                value={state.customerDraft.phone}
                onChange={(event) =>
                  stateAction.setCustomerDraft({
                    ...state.customerDraft,
                    phone: event.target.value,
                  })
                }
                onBlur={() => setPhoneTouched(true)}
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                name="customerEmail"
                value={state.customerDraft.email}
                onChange={(event) =>
                  stateAction.setCustomerDraft({
                    ...state.customerDraft,
                    email: event.target.value,
                  })
                }
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label>Poznámka</label>
              <textarea
                name="customerNote"
                value={state.customerDraft.note}
                onChange={(event) =>
                  stateAction.setCustomerDraft({
                    ...state.customerDraft,
                    note: event.target.value,
                  })
                }
              />
            </div>
          </div>

          {duplicateMatch ? (
            <div className={styles.duplicateBanner}>
              <p>
                Zákazník s týmto číslom už existuje: <strong>{duplicateMatch.name}</strong>
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => applySelectedCustomer(duplicateMatch)}
              >
                Použiť tohto zákazníka
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function DogStep({ customers, state, stateAction }: DogStepProps) {
  const selectedCustomer = customers.find((customer) => customer.id === state.selectedCustomerId) ?? null;
  const customerDogs = selectedCustomer?.dogs ?? [];

  function clearDogSelection() {
    stateAction.setDogMode('new');
    stateAction.setSelectedDogId('');
    stateAction.setDogDraft(EMPTY_DOG_DRAFT);
  }

  return (
    <section className={styles.detailCard}>
      <p className={styles.sectionKicker}>2. Pes</p>

      {!selectedCustomer && state.customerMode !== 'new' ? (
        <p className={styles.emptyState}>Najprv vyber zákazníka alebo vytvor nového.</p>
      ) : (
        <>
          {customerDogs.length > 0 ? (
            <div className={styles.choiceChipRow}>
              {customerDogs.map((dog) => (
                <button
                  key={dog.id}
                  type="button"
                  className={`${styles.choiceChip} ${state.selectedDogId === dog.id ? styles.choiceChipActive : ''}`}
                  onClick={() => {
                    stateAction.setDogMode('existing');
                    stateAction.setSelectedDogId(dog.id);
                    stateAction.setDogDraft(toDogDraft(dog));
                  }}
                >
                  {dog.name} · {dog.sizeLabel}
                </button>
              ))}
              <button type="button" className="btn btn--ghost" onClick={clearDogSelection}>
                + Nový pes
              </button>
            </div>
          ) : null}

          {state.dogMode === 'new' ? (
            <div className={styles.newCustomerPanel}>
              {customerDogs.length > 0 ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => stateAction.setDogMode('existing')}
                >
                  Vybrať existujúceho psa
                </button>
              ) : null}

              <div className={styles.formGrid}>
                <input type="hidden" name="dogId" value={state.selectedDogId} />
                <div className={styles.field}>
                  <label>Meno</label>
                  <input
                    name="dogName"
                    value={state.dogDraft.name}
                    onChange={(event) =>
                      stateAction.setDogDraft({
                        ...state.dogDraft,
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Plemeno</label>
                  <input
                    name="dogBreed"
                    value={state.dogDraft.breed}
                    onChange={(event) =>
                      stateAction.setDogDraft({
                        ...state.dogDraft,
                        breed: event.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>Veľkosť</label>
                  <select
                    name="dogSize"
                    value={state.dogDraft.size}
                    onChange={(event) =>
                      stateAction.setDogDraft({
                        ...state.dogDraft,
                        size: event.target.value as 'SMALL' | 'MEDIUM' | 'LARGE',
                      })
                    }
                  >
                    {DOG_SIZE_SELECT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label>Poznámka</label>
                  <textarea
                    name="dogNote"
                    value={state.dogDraft.note}
                    onChange={(event) =>
                      stateAction.setDogDraft({
                        ...state.dogDraft,
                        note: event.target.value,
                      })
                    }
                  />
                </div>
                <details className={styles.inlineAccordion}>
                  <summary>Ďalšie poznámky</summary>
                  <div className={styles.formGrid}>
                    <div className={`${styles.field} ${styles.fieldFull}`}>
                      <label>Povaha</label>
                      <textarea
                        name="temperamentNote"
                        value={state.dogDraft.temperamentNote}
                        onChange={(event) =>
                          stateAction.setDogDraft({
                            ...state.dogDraft,
                            temperamentNote: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={`${styles.field} ${styles.fieldFull}`}>
                      <label>Zdravie</label>
                      <textarea
                        name="healthNote"
                        value={state.dogDraft.healthNote}
                        onChange={(event) =>
                          stateAction.setDogDraft({
                            ...state.dogDraft,
                            healthNote: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ) : state.selectedDogId ? (
            <div className={styles.selectedSummaryRow}>
              <div>
                <strong>{state.dogDraft.name}</strong>
                <p className={styles.detailMeta}>
                  {state.dogDraft.breed || 'Bez plemena'} ·{' '}
                  {DOG_SIZE_SELECT_OPTIONS.find((option) => option.value === state.dogDraft.size)?.label}
                </p>
              </div>
              <button type="button" className="btn btn--ghost" onClick={clearDogSelection}>
                Zmeniť
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export function TimingStep({ availabilityReservations, state, stateAction }: TimingStepProps) {
  return (
    <section className={styles.detailCard}>
      <p className={styles.sectionKicker}>3. Termín</p>

      <ReservationAvailabilityPanel
        reservations={availabilityReservations}
        date={state.reservationDraft.date}
        time={state.reservationDraft.time}
        durationMin={state.reservationDraft.durationMin}
        availabilityCursor={state.availabilityCursor}
        onDateChange={(value) =>
          stateAction.setReservationDraft({
            ...state.reservationDraft,
            date: value,
          })
        }
        onTimeChange={(value) =>
          stateAction.setReservationDraft({
            ...state.reservationDraft,
            time: value,
          })
        }
        onDurationChange={(value) =>
          stateAction.setReservationDraft({
            ...state.reservationDraft,
            durationMin: value,
          })
        }
        onAvailabilityCursorChange={stateAction.setAvailabilityCursor}
      />

      <div className={styles.formGrid}>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label>Interná poznámka</label>
          <textarea
            name="internalNote"
            value={state.reservationDraft.internalNote}
            onChange={(event) =>
              stateAction.setReservationDraft({
                ...state.reservationDraft,
                internalNote: event.target.value,
              })
            }
          />
        </div>
      </div>
    </section>
  );
}

export function AddonsStep({ state, stateAction }: AddonsStepProps) {
  return (
    <section className={styles.detailCard}>
      <p className={styles.sectionKicker}>4. Doplnky a strih</p>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Typ strihu</label>
          <select
            name="cutType"
            value={state.reservationDraft.cutType}
            onChange={(event) =>
              stateAction.setReservationDraft({
                ...state.reservationDraft,
                cutType: event.target.value,
              })
            }
          >
            {BOOKING_CUT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.checkboxGridCompact}>
        {BOOKING_ADDONS.map((addon) => {
          const active = state.reservationDraft.serviceIds.includes(addon.code);

          return (
            <label key={addon.code} className={`${styles.checkboxCard} ${active ? styles.checkboxCardActive : ''}`}>
              <input
                type="checkbox"
                name="serviceIds"
                value={addon.code}
                checked={active}
                onChange={() =>
                  stateAction.setReservationDraft({
                    ...state.reservationDraft,
                    serviceIds: setArrayValue(state.reservationDraft.serviceIds, addon.code, active),
                  })
                }
              />
              <strong>{addon.label}</strong>
              <span>{addon.note}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export function SubmitPanel({
  state,
  pending,
  customerMode,
  dogMode,
  selectedCustomerId,
  selectedDogId,
  customerDraft,
  dogDraft,
  reservationDraft,
}: SubmitPanelProps) {
  return (
    <section className={styles.detailCard}>
      {state.kind !== 'idle' ? (
        <div
          className={`${styles.stateBanner} ${
            state.kind === 'error'
              ? styles.stateBannerError
              : state.kind === 'warning'
                ? styles.stateBannerWarning
                : styles.stateBannerSuccess
          }`}
        >
          <p className={styles.stateBannerTitle}>
            {state.kind === 'error'
              ? 'Nepodarilo sa uložiť'
              : state.kind === 'warning'
                ? 'Uložené s upozornením'
                : 'Uložené'}
          </p>
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

      <input type="hidden" name="customerId" value={selectedCustomerId} />
      {customerMode === 'select' ? (
        <>
          <input type="hidden" name="customerName" value={customerDraft.name} />
          <input type="hidden" name="customerPhone" value={customerDraft.phone} />
          <input type="hidden" name="customerEmail" value={customerDraft.email} />
          <input type="hidden" name="customerNote" value={customerDraft.note} />
        </>
      ) : null}

      <input type="hidden" name="dogId" value={selectedDogId} />
      {dogMode === 'existing' ? (
        <>
          <input type="hidden" name="dogName" value={dogDraft.name} />
          <input type="hidden" name="dogBreed" value={dogDraft.breed} />
          <input type="hidden" name="dogSize" value={dogDraft.size} />
          <input type="hidden" name="dogNote" value={dogDraft.note} />
          <input type="hidden" name="temperamentNote" value={dogDraft.temperamentNote} />
          <input type="hidden" name="coatType" value={dogDraft.coatType} />
          <input type="hidden" name="healthNote" value={dogDraft.healthNote} />
          <input type="hidden" name="groomingNotes" value={dogDraft.groomingNotes} />
        </>
      ) : null}

      <button className="btn btn--primary" type="submit" disabled={pending}>
        {pending ? 'Ukladám...' : 'Uložiť ako potvrdenú'}
      </button>

      <input type="hidden" name="date" value={reservationDraft.date} />
      <input type="hidden" name="time" value={reservationDraft.time} />
      <input type="hidden" name="durationMin" value={reservationDraft.durationMin} />
    </section>
  );
}
