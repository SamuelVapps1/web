'use client';

import { useActionState, useEffect, useState } from 'react';
import Stepper from './stepper';
import styles from '../booking.module.css';
import {
  deserializeReservationRecord,
  getAvailableStartTimes,
  getDayAvailability,
  type DogSize,
  type SerializedReservationRecord,
  type ReservationRecord,
} from '@/lib/reservations';
import { getBratislavaWeekdayIndex, localDateTimeToUtc, parseDateKey } from '@/lib/time';
import { submitReservation, type ReservationSubmitState } from '../actions';

type MonthState = {
  year: number;
  month: number;
};

type BookingWizardProps = {
  reservations: SerializedReservationRecord[];
  todayDateKey: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  discountCode: string | null;
};

type DogFormState = {
  name: string;
  breed: string;
  size: DogSize;
  service: string;
  coatState: string;
  temperament: string;
  notes: string;
};

type ClientFormState = {
  name: string;
  phone: string;
};

const STEPS = ['Vyberte deň', 'Vyberte čas', 'Váš pes', 'Vaše údaje', 'Zhrnutie'];

const COAT_OPTIONS = ['Bežná', 'Mierne zaplstnatená', 'Silne splstnatená'] as const;
const TEMPERAMENT_OPTIONS = ['Pokojný', 'Nervózny', 'Reaktívny / ťažko zvládnuteľný'] as const;

function parseMonthState(dateKey: string): MonthState {
  const { year, month } = parseDateKey(dateKey);
  return { year, month };
}

function formatMonthTitle(state: MonthState): string {
  const date = new Date(Date.UTC(state.year, state.month - 1, 1, 12, 0, 0));
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 12, 0, 0)).getUTCDate();
}

function shiftMonth(state: MonthState, delta: number): MonthState {
  const date = new Date(Date.UTC(state.year, state.month - 1 + delta, 1, 12, 0, 0));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

function dayButtonState(
  dateKey: string,
  reservations: ReservationRecord[],
  dogSize: DogSize,
  todayDateKey: string,
  now: Date,
) {
  const availability = getDayAvailability(dateKey, reservations, dogSize, now);
  const isPast = dateKey < todayDateKey;
  const disabled = isPast || availability.isClosed || availability.isNoSlots;
  return { availability, disabled };
}

export default function BookingWizard({
  reservations,
  todayDateKey,
  utmSource,
  utmMedium,
  utmCampaign,
  discountCode,
}: BookingWizardProps) {
  const normalizedReservations = reservations.map(deserializeReservationRecord);
  const [now] = useState(() => new Date());
  const [submissionState, formAction, isPending] = useActionState<ReservationSubmitState, FormData>(
    submitReservation,
    { status: 'idle' },
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');
  const [selectedTimeKey, setSelectedTimeKey] = useState('');
  const [monthState, setMonthState] = useState<MonthState>(parseMonthState(todayDateKey));
  const [dogForm, setDogForm] = useState<DogFormState>({
    name: '',
    breed: '',
    size: 'medium',
    service: '',
    coatState: COAT_OPTIONS[0],
    temperament: TEMPERAMENT_OPTIONS[0],
    notes: '',
  });
  const [clientForm, setClientForm] = useState<ClientFormState>({
    name: '',
    phone: '',
  });

  useEffect(() => {
    if (!selectedDateKey) {
      return;
    }

    const availableTimes = getAvailableStartTimes(selectedDateKey, normalizedReservations, dogForm.size, now);
    if (selectedTimeKey && !availableTimes.includes(selectedTimeKey)) {
      setSelectedTimeKey('');
    }
  }, [dogForm.size, normalizedReservations, reservations, selectedDateKey, selectedTimeKey, now]);

  const selectedDateAvailability = selectedDateKey
    ? getDayAvailability(selectedDateKey, normalizedReservations, dogForm.size, now)
    : null;
  const selectedDayTimes = selectedDateKey
    ? getAvailableStartTimes(selectedDateKey, normalizedReservations, dogForm.size, now)
    : [];

  const selectedStart = selectedDateKey && selectedTimeKey
    ? localDateTimeToUtc(selectedDateKey, selectedTimeKey)
    : null;
  const selectedEnd = selectedStart
    ? new Date(selectedStart.getTime() + (dogForm.size === 'small' ? 60 : dogForm.size === 'large' ? 120 : 90) * 60 * 1000)
    : null;

  if (submissionState.status === 'success' && submissionState.reservationId) {
    return (
      <section className={styles.confirmation}>
        <div className={styles.confirmationCard}>
          <p>Ďakujeme. Vašu rezerváciu sme prijali. Termín vám potvrdíme telefonicky.</p>
        </div>
      </section>
    );
  }

  const monthDays = getDaysInMonth(monthState.year, monthState.month);
  const firstDay = new Date(Date.UTC(monthState.year, monthState.month - 1, 1, 12, 0, 0));
  const firstWeekday = getBratislavaWeekdayIndex(firstDay);
  const leadingDays = (firstWeekday + 6) % 7;

  const previousMonth = shiftMonth(monthState, -1);
  const canGoBack = `${monthState.year}-${String(monthState.month).padStart(2, '0')}` >
    `${parseDateKey(todayDateKey).year}-${String(parseDateKey(todayDateKey).month).padStart(2, '0')}`;

  const canAdvance =
    (currentStep === 0 && Boolean(selectedDateKey)) ||
    (currentStep === 1 && Boolean(selectedTimeKey)) ||
    (currentStep === 2 && Boolean(dogForm.name.trim() && dogForm.breed.trim() && dogForm.service.trim())) ||
    (currentStep === 3 && Boolean(clientForm.name.trim() && clientForm.phone.trim()));

  return (
    <div className={styles.wizardShell}>
      <section className={styles.panel}>
        <div className={styles.panelInner}>
          <Stepper labels={STEPS} currentStep={currentStep} onStepChange={setCurrentStep} />

          <form action={formAction}>
            <input type="hidden" name="startsAt" value={selectedStart?.toISOString() ?? ''} />
            <input type="hidden" name="endsAt" value={selectedEnd?.toISOString() ?? ''} />
            <input type="hidden" name="selectedDate" value={selectedDateKey} />
            <input type="hidden" name="selectedTime" value={selectedTimeKey} />
            <input type="hidden" name="utmSource" value={utmSource ?? ''} />
            <input type="hidden" name="utmMedium" value={utmMedium ?? ''} />
            <input type="hidden" name="utmCampaign" value={utmCampaign ?? ''} />
            <input type="hidden" name="discountCode" value={discountCode ?? ''} />

            <div className={styles.body}>
              {currentStep === 0 && (
                <div className={styles.calendar}>
                  <div className={styles.sectionTitle}>
                    <h2>Vyberte deň</h2>
                  </div>

                  <div className={styles.calendarHeader}>
                    <div className={styles.monthTitle}>{formatMonthTitle(monthState)}</div>
                    <div className={styles.monthNav}>
                      <button
                        type="button"
                        className={`${styles.monthNavButton} ${!canGoBack ? styles.dayButtonDisabled : ''}`}
                        onClick={() => {
                          if (canGoBack) {
                            setMonthState(previousMonth);
                          }
                        }}
                        disabled={!canGoBack}
                        aria-label="Predchádzajúci mesiac"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className={styles.monthNavButton}
                        onClick={() => setMonthState(shiftMonth(monthState, 1))}
                        aria-label="Nasledujúci mesiac"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <div className={styles.weekdayRow}>
                    {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map((weekday) => (
                      <div key={weekday} className={styles.weekdayCell}>
                        {weekday}
                      </div>
                    ))}
                  </div>

                  <div className={styles.dayGrid}>
                    {Array.from({ length: leadingDays }).map((_, index) => (
                      <div key={`pad-${index}`} />
                    ))}
                    {Array.from({ length: monthDays }).map((_, index) => {
                      const day = index + 1;
                      const dateKey = `${monthState.year}-${String(monthState.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const { availability, disabled } = dayButtonState(dateKey, normalizedReservations, dogForm.size, todayDateKey, now);
                      const isSelected = selectedDateKey === dateKey;

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          className={[
                            styles.dayButton,
                            isSelected ? styles.dayButtonSelected : '',
                            disabled ? styles.dayButtonDisabled : '',
                          ].join(' ')}
                          disabled={disabled}
                          onClick={() => {
                            setSelectedDateKey(dateKey);
                            setSelectedTimeKey('');
                            setCurrentStep(1);
                          }}
                        >
                          <span className={styles.dayNumber}>{day}</span>
                          <span className={styles.dayState}>
                            {availability.isClosed
                              ? 'Zatvorené'
                              : availability.isNoSlots
                                ? 'Bez termínu'
                                : `${availability.availableTimes.length} term.`
                            }
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDateAvailability?.isClosed ? (
                    <div className={styles.statusNote}>V tento deň máme zatvorené.</div>
                  ) : selectedDateAvailability?.isNoSlots ? (
                    <div className={styles.statusNote}>V tento deň už nemáme voľný termín. Skúste prosím iný deň.</div>
                  ) : null}
                </div>
              )}

              {currentStep === 1 && (
                <div className={styles.slots}>
                  <div className={styles.sectionTitle}>
                    <h2>Vyberte čas</h2>
                  </div>

                  {selectedDateAvailability?.isClosed ? (
                    <div className={styles.statusNote}>V tento deň máme zatvorené.</div>
                  ) : selectedDateAvailability?.isNoSlots ? (
                    <div className={styles.statusNote}>V tento deň už nemáme voľný termín. Skúste prosím iný deň.</div>
                  ) : (
                    <div className={styles.slotGrid}>
                      {selectedDayTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={[
                            styles.slotButton,
                            selectedTimeKey === time ? styles.slotButtonSelected : '',
                          ].join(' ')}
                          onClick={() => {
                            setSelectedTimeKey(time);
                            setCurrentStep(2);
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {currentStep === 2 && (
                <div className={styles.body}>
                  <div className={styles.sectionTitle}>
                    <h2>Váš pes</h2>
                  </div>

                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span className={styles.label}>Meno psa</span>
                      <input
                        name="dogName"
                        className={styles.input}
                        value={dogForm.name}
                        onChange={(event) => setDogForm((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Plemeno</span>
                      <input
                        name="dogBreed"
                        className={styles.input}
                        value={dogForm.breed}
                        onChange={(event) => setDogForm((current) => ({ ...current, breed: event.target.value }))}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Veľkosť psa</span>
                      <select
                        name="dogSize"
                        className={styles.select}
                        value={dogForm.size}
                        onChange={(event) => {
                          const size = event.target.value as DogSize;
                          setDogForm((current) => ({ ...current, size }));
                        }}
                        required
                      >
                        <option value="small">Malý</option>
                        <option value="medium">Stredný</option>
                        <option value="large">Veľký</option>
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Úkon</span>
                      <input
                        name="service"
                        className={styles.input}
                        value={dogForm.service}
                        onChange={(event) => setDogForm((current) => ({ ...current, service: event.target.value }))}
                        required
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Stav srsti</span>
                      <select
                        name="coatState"
                        className={styles.select}
                        value={dogForm.coatState}
                        onChange={(event) => setDogForm((current) => ({ ...current, coatState: event.target.value }))}
                        required
                      >
                        {COAT_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>Povaha</span>
                      <select
                        name="temperament"
                        className={styles.select}
                        value={dogForm.temperament}
                        onChange={(event) => setDogForm((current) => ({ ...current, temperament: event.target.value }))}
                        required
                      >
                        {TEMPERAMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>

                    <label className={`${styles.field} ${styles.fieldFull}`}>
                      <span className={styles.label}>Poznámka (nepovinné)</span>
                      <textarea
                        name="notes"
                        className={styles.textarea}
                        value={dogForm.notes}
                        onChange={(event) => setDogForm((current) => ({ ...current, notes: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className={styles.body}>
                  <div className={styles.sectionTitle}>
                    <h2>Vaše údaje</h2>
                  </div>

                  <div className={styles.fieldGrid}>
                    <label className={`${styles.field} ${styles.fieldFull}`}>
                      <span className={styles.label}>Meno a priezvisko</span>
                      <input
                        name="clientName"
                        className={styles.input}
                        value={clientForm.name}
                        onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </label>

                    <label className={`${styles.field} ${styles.fieldFull}`}>
                      <span className={styles.label}>Telefón</span>
                      <input
                        name="clientPhone"
                        className={styles.input}
                        inputMode="tel"
                        autoComplete="tel"
                        value={clientForm.phone}
                        onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))}
                        pattern="^(?:\\+421|0)\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}$"
                        placeholder="+421 944 240 116"
                        required
                      />
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className={styles.body}>
                  <div className={styles.sectionTitle}>
                    <h2>Zhrnutie</h2>
                  </div>

                  <div className={styles.summaryBox}>
                    <div className={styles.summaryGrid}>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Deň</span>
                        <span className={styles.summaryValue}>{selectedDateKey}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Čas</span>
                        <span className={styles.summaryValue}>{selectedTimeKey}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Meno psa</span>
                        <span className={styles.summaryValue}>{dogForm.name}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Plemeno</span>
                        <span className={styles.summaryValue}>{dogForm.breed}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Veľkosť psa</span>
                        <span className={styles.summaryValue}>{dogForm.size}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Úkon</span>
                        <span className={styles.summaryValue}>{dogForm.service}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Meno a priezvisko</span>
                        <span className={styles.summaryValue}>{clientForm.name}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Telefón</span>
                        <span className={styles.summaryValue}>{clientForm.phone}</span>
                      </div>
                    </div>

                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Poznámka</span>
                      <span className={styles.summaryValue}>{dogForm.notes || '—'}</span>
                    </div>
                  </div>

                  {submissionState.status === 'error' ? (
                    <div className={`${styles.alert} ${styles.alertError}`}>{submissionState.message}</div>
                  ) : null}
                </div>
              )}

              <div className={styles.footerActions}>
                <div />

                <div className={styles.buttonGroup}>
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => setCurrentStep((step) => Math.min(step + 1, 4))}
                      disabled={!canAdvance}
                      aria-label="Ďalší krok"
                    >
                      →
                    </button>
                  ) : (
                    <button type="submit" className="btn btn--primary" disabled={isPending}>
                      Odoslať rezerváciu
                    </button>
                  )}
                </div>
              </div>

              {submissionState.status === 'error' && currentStep < 4 ? (
                <div className={`${styles.alert} ${styles.alertError}`}>{submissionState.message}</div>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <aside className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.summaryBox}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Vybraný deň</span>
              <span className={styles.summaryValue}>{selectedDateKey}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Vybraný čas</span>
              <span className={styles.summaryValue}>{selectedTimeKey || '—'}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Veľkosť psa</span>
              <span className={styles.summaryValue}>{dogForm.size}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Voľné termíny</span>
              <span className={styles.summaryValue}>{selectedDayTimes.length}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
