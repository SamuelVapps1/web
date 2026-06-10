'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitBooking, type BookingSubmitState } from '../actions';
import styles from '../booking.module.css';
import {
  BOOKING_PHONE_PATTERN,
  DOG_SIZE_OPTIONS,
  findMatchingGroomingServiceName,
  formatBookingCurrency,
  formatBookingDate,
  getAllowedBookingTimes,
  getBookingMinDateKey,
  getGroomingSizeFromServiceName,
  type BookingServiceRecord,
  type DogSize,
} from '@/lib/booking';

type BookingFlowProps = {
  services: readonly BookingServiceRecord[];
};

type StepKey = 1 | 2 | 3 | 4;

const STEP_DEFINITIONS = [
  {
    step: 1,
    title: 'Pes',
    hint: 'Meno, plemeno a veľkosť.',
  },
  {
    step: 2,
    title: 'Služby',
    hint: 'Vyberieme základ a doplnky.',
  },
  {
    step: 3,
    title: 'Termín',
    hint: 'Pracovné dni a voľné časy.',
  },
  {
    step: 4,
    title: 'Kontakt',
    hint: 'Pošleme potvrdenie telefonicky.',
  },
] as const;

const INITIAL_STATE: BookingSubmitState = { status: 'idle' };

function getServiceRank(service: BookingServiceRecord): number {
  const normalized = service.name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (normalized.startsWith('strihanie maly')) {
    return 0;
  }

  if (normalized.startsWith('strihanie stredny')) {
    return 1;
  }

  if (normalized.startsWith('strihanie velky')) {
    return 2;
  }

  if (normalized.startsWith('kupanie')) {
    return 3;
  }

  if (normalized.startsWith('pazuriky')) {
    return 4;
  }

  if (normalized.startsWith('cistenie usi')) {
    return 5;
  }

  return 99;
}

function Stepper({
  activeStep,
  onNavigate,
}: {
  activeStep: StepKey;
  onNavigate: (step: StepKey) => void;
}) {
  return (
    <nav className={styles.stepper} aria-label="Postup rezervácie">
      {STEP_DEFINITIONS.map((item) => {
        const isActive = activeStep === item.step;
        const isComplete = activeStep > item.step;

        return (
          <button
            key={item.step}
            type="button"
            className={`${styles.stepperButton}`}
            onClick={() => onNavigate(item.step as StepKey)}
          >
            <span
              className={`${styles.stepperItem} ${isActive ? styles.stepperItemActive : ''}`}
            >
              <span
                className={`${styles.stepNumber} ${
                  isActive || isComplete ? styles.stepNumberActive : ''
                }`}
              >
                {item.step}
              </span>
              <span className={styles.stepText}>
                <span className={styles.stepLabel}>{item.title}</span>
                <span className={styles.stepHint}>{item.hint}</span>
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn--primary btn--full" type="submit" disabled={pending}>
      {pending ? 'Odosielame žiadosť…' : 'Odoslať žiadosť'}
    </button>
  );
}

export function BookingFlow({ services }: BookingFlowProps) {
  const orderedServices = useMemo(
    () => [...services].sort((left, right) => getServiceRank(left) - getServiceRank(right)),
    [services],
  );

  const groomingServiceNames = useMemo(
    () =>
      new Set(
        orderedServices
          .filter((service) => getGroomingSizeFromServiceName(service.name))
          .map((service) => service.name),
      ),
    [orderedServices],
  );

  const minDateKey = getBookingMinDateKey();

  const [step, setStep] = useState<StepKey>(1);
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogSize, setDogSize] = useState<DogSize>('SMALL');
  const [dogNote, setDogNote] = useState('');
  const [selectedServiceNames, setSelectedServiceNames] = useState<string[]>(() => {
    const baseServiceName = findMatchingGroomingServiceName(orderedServices, 'SMALL');
    return baseServiceName ? [baseServiceName] : orderedServices.slice(0, 1).map((service) => service.name);
  });
  const [selectedDate, setSelectedDate] = useState<string>(minDateKey);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [company, setCompany] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const [state, formAction] = useActionState(submitBooking, INITIAL_STATE);

  const baseServiceName = useMemo(
    () => findMatchingGroomingServiceName(orderedServices, dogSize),
    [orderedServices, dogSize],
  );

  const selectedServices = useMemo(
    () => orderedServices.filter((service) => selectedServiceNames.includes(service.name)),
    [orderedServices, selectedServiceNames],
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((total, service) => total + Number(service.basePrice), 0),
    [selectedServices],
  );

  const totalDurationMin = useMemo(
    () => selectedServices.reduce((total, service) => total + service.baseDurationMin, 0),
    [selectedServices],
  );

  const availableTimes = useMemo(
    () => getAllowedBookingTimes(selectedDate, totalDurationMin),
    [selectedDate, totalDurationMin],
  );

  const requestedDateLabel = selectedDate ? formatBookingDate(selectedDate) : '—';
  const requestedTimeLabel = selectedTime || '—';
  const selectedServiceLabel =
    selectedServices.length > 0
      ? selectedServices.map((service) => service.name).join(', ')
      : '—';

  function canAdvanceFromStep(currentStep: StepKey): boolean {
    if (currentStep === 1) {
      return dogName.trim().length > 0 && dogBreed.trim().length > 0 && Boolean(dogSize);
    }

    if (currentStep === 2) {
      return selectedServiceNames.length > 0;
    }

    if (currentStep === 3) {
      return Boolean(selectedDate) && Boolean(selectedTime) && availableTimes.includes(selectedTime);
    }

    if (currentStep === 4) {
      return (
        customerName.trim().length > 0 &&
        BOOKING_PHONE_PATTERN.test(customerPhone.trim()) &&
        selectedServiceNames.length > 0
      );
    }

    return true;
  }

  function goNext() {
    if (!canAdvanceFromStep(step)) {
      setClientError('Skontrolujte, či sú vyplnené všetky povinné polia.');
      return;
    }

    setClientError(null);
    setStep((current) => Math.min(4, current + 1) as StepKey);
  }

  function goBack() {
    setClientError(null);
    setStep((current) => Math.max(1, current - 1) as StepKey);
  }

  function setServicesAndValidateTime(nextServiceNames: string[]) {
    const nextDuration = orderedServices.reduce((total, service) => {
      return nextServiceNames.includes(service.name) ? total + service.baseDurationMin : total;
    }, 0);

    const nextAvailableTimes = getAllowedBookingTimes(selectedDate, nextDuration);
    if (selectedTime && !nextAvailableTimes.includes(selectedTime)) {
      setSelectedTime('');
    }

    setSelectedServiceNames(nextServiceNames);
  }

  function handleDogSizeChange(nextSize: DogSize) {
    setDogSize(nextSize);
    const nextBaseServiceName = findMatchingGroomingServiceName(orderedServices, nextSize);

    const addonNames = selectedServiceNames.filter((name) => !groomingServiceNames.has(name));
    const nextServiceNames = nextBaseServiceName
      ? Array.from(new Set([nextBaseServiceName, ...addonNames]))
      : addonNames;

    setServicesAndValidateTime(nextServiceNames);
  }

  function toggleAddon(serviceName: string) {
    if (serviceName === baseServiceName) {
      return;
    }

    const nextServiceNames = selectedServiceNames.includes(serviceName)
      ? selectedServiceNames.filter((name) => name !== serviceName)
      : [...selectedServiceNames, serviceName];

    setServicesAndValidateTime(nextServiceNames);
  }

  function renderServiceCard(service: BookingServiceRecord) {
    const groomingSize = getGroomingSizeFromServiceName(service.name);
    const isBaseService = groomingSize !== null && service.name === baseServiceName;
    const isLocked = groomingSize !== null && !isBaseService;
    const isSelected = selectedServiceNames.includes(service.name);

    return (
      <label
        key={service.name}
        className={`${styles.serviceCard} ${isSelected ? styles.serviceCardSelected : ''} ${
          isLocked ? styles.serviceCardLocked : ''
        }`}
      >
        <input
          className={styles.serviceInput}
          type="checkbox"
          name="serviceIds"
          value={service.name}
          checked={isSelected}
          onChange={() => toggleAddon(service.name)}
          disabled={isLocked}
        />
        <span className={styles.serviceCardCheck} aria-hidden="true" />
        <span className={styles.serviceCardBody}>
          <span className={styles.serviceCardTitle}>{service.name}</span>
          <span className={styles.serviceCardMeta}>
            {formatBookingCurrency(Number(service.basePrice))} · {service.baseDurationMin} min
          </span>
          {groomingSize && isBaseService ? (
            <span className={styles.serviceCardNote}>Základ podľa veľkosti psa</span>
          ) : null}
          {isLocked ? <span className={styles.serviceCardNote}>Pre inú veľkosť psa</span> : null}
        </span>
      </label>
    );
  }

  if (state.status === 'success') {
    return (
      <section className={styles.confirmation} aria-live="polite">
        <div className={styles.confirmationCard}>
          <p className="eyebrow">Žiadosť prijatá</p>
          <h2>Ďakujeme, vašu žiadosť sme prijali.</h2>
          <p>Termín potvrdíme telefonicky.</p>
          <p>
            Zavolajte nám na <a href="tel:+421944240116">+421 944 240 116</a>, ak si chcete ešte
            niečo overiť.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.wizardShell}>
      <form className={`${styles.panel} ${styles.panelInner}`} action={formAction}>
        <input type="hidden" name="sourceCode" value="" />
        <input type="hidden" name="selectedTime" value={selectedTime} />
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className={styles.honeypot}
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />

        <Stepper activeStep={step} onNavigate={(targetStep) => setStep(targetStep)} />

        <div className={styles.body}>
          {step === 1 ? (
            <>
              <div className={styles.sectionTitle}>
                <h2>Pes</h2>
                <span className={styles.sectionMeta}>Základné údaje o klientovi.</span>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="dogName">
                    Meno psa
                  </label>
                  <input
                    id="dogName"
                    name="dogName"
                    className={styles.input}
                    value={dogName}
                    onChange={(event) => setDogName(event.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="dogBreed">
                    Plemeno
                  </label>
                  <input
                    id="dogBreed"
                    name="dogBreed"
                    className={styles.input}
                    value={dogBreed}
                    onChange={(event) => setDogBreed(event.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <fieldset className={`${styles.field} ${styles.fieldFull}`}>
                  <legend className={styles.label}>Veľkosť</legend>
                  <div className={styles.sizeGrid}>
                    {DOG_SIZE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`${styles.sizeCard} ${
                          dogSize === option.value ? styles.sizeCardSelected : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="dogSize"
                          value={option.value}
                          checked={dogSize === option.value}
                          onChange={() => handleDogSizeChange(option.value)}
                        />
                        <span className={styles.sizeCardTitle}>{option.label}</span>
                        <span className={styles.sizeCardNote}>{option.note}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="dogNote">
                    Poznámka o povahe alebo zdraví
                  </label>
                  <textarea
                    id="dogNote"
                    name="dogNote"
                    className={styles.textarea}
                    value={dogNote}
                    onChange={(event) => setDogNote(event.target.value)}
                    placeholder="Napíšte nám, čo máme vedieť pred návštevou."
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className={styles.sectionTitle}>
                <h2>Služby</h2>
                <span className={styles.sectionMeta}>Vyberte základ aj doplnky.</span>
              </div>

              <div className={styles.serviceSection}>
                <div className={styles.serviceSectionHead}>
                  <h3>Základná úprava</h3>
                  <p>Strihanie sa prispôsobí veľkosti psa.</p>
                </div>
                <div className={styles.serviceGrid}>
          {orderedServices.filter((service) => getGroomingSizeFromServiceName(service.name)).map(renderServiceCard)}
                </div>
              </div>

              <div className={styles.serviceSection}>
                <div className={styles.serviceSectionHead}>
                  <h3>Doplnky</h3>
                  <p>Kúpanie, pazúriky a čistenie uší môžete pridať podľa potreby.</p>
                </div>
                <div className={styles.serviceGrid}>
                  {orderedServices.filter((service) => !getGroomingSizeFromServiceName(service.name)).map(renderServiceCard)}
                </div>
              </div>

              <div className={styles.serviceSummary}>
                <strong>
                  {formatBookingCurrency(totalPrice)} · {totalDurationMin} min
                </strong>
                <span>Konečná cena podľa stavu srsti a povahy psa.</span>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className={styles.sectionTitle}>
                <h2>Termín</h2>
                <span className={styles.sectionMeta}>Len Po – Pia, najskôr od zajtra.</span>
              </div>

              <div className={styles.fieldGrid}>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="selectedDate">
                    Deň
                  </label>
                  <input
                    id="selectedDate"
                    name="selectedDate"
                    type="date"
                    className={styles.input}
                    min={minDateKey}
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedTime('');
                    }}
                    required
                  />
                  <p className={styles.helperText}>
                    Najskorší povolený termín je {formatBookingDate(minDateKey)}.
                  </p>
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.label}>Preferovaný čas</span>
                  <div className={styles.slotGrid}>
                    {selectedDate && availableTimes.length > 0 ? (
                      availableTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={`${styles.slotButton} ${
                            selectedTime === time ? styles.slotButtonSelected : ''
                          }`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))
                    ) : (
                      <p className={styles.statusNote}>
                        Vyberte deň, potom si zvolíte čas podľa dĺžky služieb.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <div className={styles.sectionTitle}>
                <h2>Kontakt</h2>
                <span className={styles.sectionMeta}>Skontrolujte súhrn a odošlite žiadosť.</span>
              </div>

              <div className={styles.summaryBox}>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Pes</span>
                    <span className={styles.summaryValue}>
                      {dogName} · {dogBreed} · {dogSize.toLowerCase()}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Služby</span>
                    <span className={styles.summaryValue}>{selectedServiceLabel}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Termín</span>
                    <span className={styles.summaryValue}>
                      {requestedDateLabel} · {requestedTimeLabel}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Spolu</span>
                    <span className={styles.summaryValue}>
                      {formatBookingCurrency(totalPrice)} · {totalDurationMin} min
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="customerName">
                    Meno
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    className={styles.input}
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="customerPhone">
                    Telefón
                  </label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    className={styles.input}
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    pattern={BOOKING_PHONE_PATTERN.source}
                    placeholder="+421 944 240 116"
                    required
                  />
                  <p className={styles.helperText}>Formát napríklad +421 944 240 116.</p>
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="customerEmail">
                    Email
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    className={styles.input}
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="voliteľné"
                  />
                </div>
              </div>

              {clientError ? (
                <div className={`${styles.alert} ${styles.alertError}`}>{clientError}</div>
              ) : null}
              {state.status === 'error' ? (
                <div className={`${styles.alert} ${styles.alertError}`}>{state.message}</div>
              ) : null}

              <div className={styles.footerActions}>
                <button type="button" className="btn btn--ghost" onClick={goBack}>
                  Späť
                </button>
                <SubmitButton />
              </div>
            </>
          ) : null}

          {state.status === 'error' && step !== 4 ? (
            <div className={`${styles.alert} ${styles.alertError}`}>{state.message}</div>
          ) : null}

          {step < 4 ? (
            <div className={styles.footerActions}>
              <button type="button" className="btn btn--ghost" onClick={goBack} disabled={step === 1}>
                Späť
              </button>
              <button type="button" className="btn btn--primary" onClick={goNext}>
                Pokračovať
              </button>
            </div>
          ) : null}
        </div>
      </form>

      <aside className={`${styles.panel} ${styles.panelInner} ${styles.summaryPanel}`}>
        <p className="eyebrow">Súhrn</p>
        <div className={styles.summaryStack}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pes</span>
            <span className={styles.summaryValue}>
              {dogName || '—'} {dogBreed ? `· ${dogBreed}` : ''}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Veľkosť</span>
            <span className={styles.summaryValue}>
              {DOG_SIZE_OPTIONS.find((option) => option.value === dogSize)?.label ?? '—'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Služby</span>
            <span className={styles.summaryValue}>{selectedServiceLabel}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termín</span>
            <span className={styles.summaryValue}>
              {requestedDateLabel} · {requestedTimeLabel}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Rozsah</span>
            <span className={styles.summaryValue}>
              {formatBookingCurrency(totalPrice)} · {totalDurationMin} min
            </span>
          </div>
          <div className={styles.summaryHint}>
            Konečná cena podľa stavu srsti a povahy psa.
          </div>
        </div>

        <div className={styles.summaryNote}>
          <strong>Otváracie hodiny</strong>
          <span>Po – Pia · 10:00 – 13:00 a 14:00 – 18:00</span>
        </div>
      </aside>
    </div>
  );
}
