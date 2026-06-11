'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import styles from '../../../admin.module.css';
import { BOOKING_ADDONS, BOOKING_CUT_TYPES } from '@/lib/booking';
import { buildWorkingDaySlots, findNextFreeWorkingSlots, findReservationCollisions } from '@/lib/admin-schedule.js';
import { getBratislavaDateKey, localDateTimeToUtc } from '@/lib/time';
import { findCustomerMatches, findDuplicateCustomerByPhone } from './manual-reservation-helpers.js';
import { type AdminActionState } from '@/app/admin/actions';

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
    healthNote: string;
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

function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSlotLabel(date: Date, timeKey: string): string {
  const formatter = new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  return `${capitalizeFirstLetter(formatter.format(date))} · ${timeKey}`;
}

function setArrayValue<T>(values: T[], value: T, active: boolean): T[] {
  if (active) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

export function CustomerStep({ customers, state, stateAction }: CustomerStepProps) {
  const selectedCustomer = customers.find((customer) => customer.id === state.selectedCustomerId) ?? null;
  const filteredCustomers = useMemo(
    () => findCustomerMatches(customers, state.customerQuery) as ManualReservationCustomer[],
    [customers, state.customerQuery],
  );
  const duplicateCustomer = useMemo(
    () => findDuplicateCustomerByPhone(customers, state.customerDraft.phone) as ManualReservationCustomer | null,
    [customers, state.customerDraft.phone],
  );
  if (selectedCustomer && state.customerMode === 'select') {
    return (
      <section className={styles.detailCard}>
        <p className={styles.sectionKicker}>1. Zákazník</p>
        <div className={styles.selectedSummaryRow}>
          <div>
            <strong>{selectedCustomer.name}</strong>
            <p className={styles.detailMeta}>{selectedCustomer.phone}</p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              stateAction.setCustomerMode('select');
              stateAction.setSelectedCustomerId('');
              stateAction.setSelectedDogId('');
              stateAction.setCustomerQuery('');
              stateAction.setShowAllCustomers(false);
              stateAction.setCustomerDraft({ name: '', phone: '', email: '', note: '' });
              stateAction.setDogMode('new');
              stateAction.setDogDraft({ name: '', breed: '', size: 'MEDIUM', note: '', temperamentNote: '', healthNote: '' });
            }}
          >
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
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Hľadať meno, telefón alebo psa"
          value={state.customerQuery}
          onChange={(event) => stateAction.setCustomerQuery(event.target.value)}
        />

        {!state.customerQuery.trim() ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => stateAction.setShowAllCustomers(!state.showAllCustomers)}
          >
            {state.showAllCustomers ? 'Skryť všetkých zákazníkov' : 'Zobraziť všetkých zákazníkov'}
          </button>
        ) : null}

        {state.customerQuery.trim() || state.showAllCustomers ? (
          <div className={styles.searchListCompact}>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className={`${styles.searchRow} ${state.selectedCustomerId === customer.id ? styles.searchRowActive : ''}`}
                  onClick={() => {
                    stateAction.setCustomerMode('select');
                    stateAction.setSelectedCustomerId(customer.id);
                    stateAction.setSelectedDogId('');
                    stateAction.setCustomerQuery('');
                    stateAction.setShowAllCustomers(false);
                    stateAction.setCustomerDraft({
                      name: customer.name,
                      phone: customer.phone,
                      email: customer.email ?? '',
                      note: customer.note ?? '',
                    });
                    stateAction.setDogMode(customer.dogs.length > 0 ? 'existing' : 'new');
                    stateAction.setDogDraft({ name: '', breed: '', size: 'MEDIUM', note: '', temperamentNote: '', healthNote: '' });
                  }}
                >
                  <strong>{customer.name}</strong>
                  <span>{customer.phone}</span>
                </button>
              ))
            ) : (
              <p className={styles.emptyState}>Nenašli sa žiadne zhody.</p>
            )}
          </div>
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
            stateAction.setCustomerDraft({ name: '', phone: '', email: '', note: '' });
            stateAction.setDogMode('new');
            stateAction.setDogDraft({ name: '', breed: '', size: 'MEDIUM', note: '', temperamentNote: '', healthNote: '' });
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
              stateAction.setCustomerDraft({ name: '', phone: '', email: '', note: '' });
              stateAction.setDogMode('new');
              stateAction.setDogDraft({ name: '', breed: '', size: 'MEDIUM', note: '', temperamentNote: '', healthNote: '' });
            }}
          >
            Vybrať existujúceho zákazníka
          </button>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Meno zákazníka</label>
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

          {duplicateCustomer ? (
            <div className={styles.duplicateBanner}>
              <p>
                Zákazník s týmto číslom už existuje: <strong>{duplicateCustomer.name}</strong>
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  stateAction.setCustomerMode('select');
                  stateAction.setSelectedCustomerId(duplicateCustomer.id);
                  stateAction.setSelectedDogId('');
                  stateAction.setCustomerQuery('');
                  stateAction.setShowAllCustomers(false);
                  stateAction.setCustomerDraft({
                    name: duplicateCustomer.name,
                    phone: duplicateCustomer.phone,
                    email: duplicateCustomer.email ?? '',
                    note: duplicateCustomer.note ?? '',
                  });
                  stateAction.setDogMode(duplicateCustomer.dogs.length > 0 ? 'existing' : 'new');
                  stateAction.setDogDraft({ name: '', breed: '', size: 'MEDIUM', note: '', temperamentNote: '', healthNote: '' });
                }}
              >
                Použiť
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

  return (
    <section className={styles.detailCard}>
      <p className={styles.sectionKicker}>2. Pes</p>

      {!selectedCustomer ? (
        <p className={styles.emptyState}>Najprv vyber zákazníka alebo vytvor nového.</p>
      ) : (
        <>
          {customerDogs.length > 0 && state.dogMode !== 'new' ? (
            <div className={styles.searchListCompact}>
              {customerDogs.map((dog) => (
                <button
                  key={dog.id}
                  type="button"
                  className={`${styles.searchRow} ${state.selectedDogId === dog.id ? styles.searchRowActive : ''}`}
                  onClick={() => {
                    stateAction.setDogMode('existing');
                    stateAction.setSelectedDogId(dog.id);
                    stateAction.setDogDraft({
                      name: dog.name,
                      breed: dog.breed ?? '',
                      size: dog.size as 'SMALL' | 'MEDIUM' | 'LARGE',
                      note: '',
                      temperamentNote: '',
                      healthNote: '',
                    });
                  }}
                >
                  <strong>{dog.name}</strong>
                  <span>
                    {dog.breed ?? 'Bez plemena'} · {dog.sizeLabel}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {customerDogs.length > 0 && state.dogMode !== 'new' ? (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                stateAction.setDogMode('new');
                stateAction.setSelectedDogId('');
                stateAction.setDogDraft({ name: '', breed: '', size: 'MEDIUM', note: '', temperamentNote: '', healthNote: '' });
              }}
            >
              + Nový pes
            </button>
          ) : null}

          {state.dogMode === 'new' ? (
            <div className={styles.newCustomerPanel}>
              {customerDogs.length > 0 ? (
              <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    stateAction.setDogMode('existing');
                    stateAction.setSelectedDogId('');
                    stateAction.setDogDraft({ name: '', breed: '', size: 'MEDIUM', note: '', temperamentNote: '', healthNote: '' });
                  }}
                >
                  Vybrať existujúceho psa
                </button>
              ) : null}
              <div className={styles.formGrid}>
                <input type="hidden" name="dogId" value={state.selectedDogId} />
                <div className={styles.field}>
                  <label>Meno psa</label>
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
                    <option value="SMALL">Malý</option>
                    <option value="MEDIUM">Stredný</option>
                    <option value="LARGE">Veľký</option>
                  </select>
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label>Poznámka k psovi</label>
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
          ) : null}
        </>
      )}
    </section>
  );
}

export function TimingStep({ availabilityReservations, state, stateAction }: TimingStepProps) {
  const confirmedReservations = useMemo(
    () =>
      availabilityReservations.map((item) => {
        const startIso = item.confirmedStart ?? item.requestedStart;
        const start = new Date(startIso);
        const end = new Date(start.getTime() + item.durationMin * 60 * 1000);

        return {
          id: item.id,
          status: item.status as 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED',
          customerName: item.customerName,
          dogName: item.dogName,
          phone: item.customerPhone,
          start,
          end,
        };
      }),
    [availabilityReservations],
  );

  const selectedWindow = useMemo(
    () => ({
      start: localDateTimeToUtc(state.reservationDraft.date, state.reservationDraft.time),
      end: new Date(
        localDateTimeToUtc(state.reservationDraft.date, state.reservationDraft.time).getTime() +
          state.reservationDraft.durationMin * 60 * 1000,
      ),
    }),
    [state.reservationDraft.date, state.reservationDraft.durationMin, state.reservationDraft.time],
  );

  const selectedCollisions = useMemo(
    () => findReservationCollisions(selectedWindow, confirmedReservations),
    [confirmedReservations, selectedWindow],
  );

  const workingSlots = useMemo(() => buildWorkingDaySlots(), []);
  const busyMap = useMemo(
    () =>
      Object.fromEntries(
        workingSlots.map((slot) => {
          const candidate = {
            start: localDateTimeToUtc(state.reservationDraft.date, slot),
            end: new Date(localDateTimeToUtc(state.reservationDraft.date, slot).getTime() + state.reservationDraft.durationMin * 60 * 1000),
          };

          return [slot, findReservationCollisions(candidate, confirmedReservations).length > 0] as const;
        }),
      ) as Record<string, boolean>,
    [confirmedReservations, state.reservationDraft.date, state.reservationDraft.durationMin, workingSlots],
  );

  const nextFreeSlots = useMemo(
    () =>
      findNextFreeWorkingSlots({
        startAt: state.availabilityCursor,
        durationMin: state.reservationDraft.durationMin,
        reservations: confirmedReservations,
        limit: 6,
      }),
    [confirmedReservations, state.availabilityCursor, state.reservationDraft.durationMin],
  );

  return (
    <section className={styles.detailCard}>
      <p className={styles.sectionKicker}>3. Termín</p>

      <div className={styles.freeSlotsPanel}>
        <div className={styles.freeSlotsHeader}>
          <div>
            <p className={styles.sectionKicker}>Najbližšie voľné termíny</p>
            <p className={styles.fieldHint}>Klikni na termín a predvyplní sa dátum aj čas.</p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              const lastSlot = nextFreeSlots[nextFreeSlots.length - 1];
              if (!lastSlot) {
                return;
              }

              stateAction.setAvailabilityCursor(new Date(lastSlot.end.getTime() + 30 * 60 * 1000));
            }}
          >
            Ďalšie termíny
          </button>
        </div>

        <div className={styles.freeSlotsGrid}>
          {nextFreeSlots.map((slot) => {
            const selected = state.reservationDraft.date === slot.dateKey && state.reservationDraft.time === slot.timeKey;

            return (
              <button
                key={`${slot.dateKey}-${slot.timeKey}`}
                type="button"
                className={`${styles.freeSlotChip} ${selected ? styles.freeSlotChipSelected : ''}`}
                aria-pressed={selected}
                onClick={() =>
                  stateAction.setReservationDraft({
                    ...state.reservationDraft,
                    date: slot.dateKey,
                    time: slot.timeKey,
                  })
                }
              >
                <span className={styles.freeSlotChipLabel}>{formatSlotLabel(slot.start, slot.timeKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Dátum</label>
          <input
            type="date"
            name="date"
            min={getBratislavaDateKey()}
            value={state.reservationDraft.date}
            onChange={(event) =>
              stateAction.setReservationDraft({
                ...state.reservationDraft,
                date: event.target.value,
              })
            }
          />
        </div>
        <div className={styles.field}>
          <label>Čas</label>
          <input
            type="time"
            name="time"
            value={state.reservationDraft.time}
            onChange={(event) =>
              stateAction.setReservationDraft({
                ...state.reservationDraft,
                time: event.target.value,
              })
            }
          />
        </div>
        <div className={styles.field}>
          <label>Trvanie</label>
          <select
            name="durationMin"
            value={state.reservationDraft.durationMin}
            onChange={(event) =>
              stateAction.setReservationDraft({
                ...state.reservationDraft,
                durationMin: Number(event.target.value),
              })
            }
          >
            {[30, 60, 90, 120, 150, 180, 210, 240].map((value) => (
              <option key={value} value={value}>
                {value} min
              </option>
            ))}
          </select>
        </div>
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

      <div className={styles.availabilitySummary}>
        <div className={styles.slotGrid} role="radiogroup" aria-label="Obsadené sloty dňa">
          {workingSlots.map((slot) => {
            const busy = busyMap[slot] ?? false;
            const active = state.reservationDraft.time === slot;

            return (
              <button
                key={slot}
                type="button"
                className={`${styles.slotButton} ${busy ? styles.slotButtonBusy : ''} ${active ? styles.slotButtonActive : ''}`}
                onClick={() =>
                  stateAction.setReservationDraft({
                    ...state.reservationDraft,
                    time: slot,
                  })
                }
              >
                <span className={styles.slotButtonTime}>{slot}</span>
                <span className={styles.slotButtonState}>{busy ? 'obsadené' : 'voľné'}</span>
              </button>
            );
          })}
        </div>

        {selectedCollisions.length > 0 ? (
          <div className={styles.availabilityBanner}>
            <p className={styles.availabilityTitle}>Koliduje s:</p>
            <div className={styles.collisionList}>
              {selectedCollisions.map((collision) => (
                <div key={collision.id} className={styles.collisionItem}>
                  <strong>
                    {collision.start} - {collision.end}
                  </strong>
                  <span>
                    {collision.customerName} / {collision.dogName} · {collision.phone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.availabilityFree}>Termín je voľný.</p>
        )}
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
          <label>Strih</label>
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

export function SubmitPanel({ state, pending, customerMode, dogMode, selectedCustomerId, selectedDogId, customerDraft, dogDraft, reservationDraft }: SubmitPanelProps) {
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
            {state.kind === 'error' ? 'Nepodarilo sa uložiť' : state.kind === 'warning' ? 'Uložené s upozornením' : 'Uložené'}
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
          <input type="hidden" name="healthNote" value={dogDraft.healthNote} />
        </>
      ) : null}
      <button className="btn btn--primary" type="submit" disabled={pending}>
        {pending ? 'Ukladám...' : 'Uložiť ako potvrdenú'}
      </button>
    </section>
  );
}
