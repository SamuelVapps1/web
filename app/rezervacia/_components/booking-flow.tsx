'use client';

import { useActionState, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFormStatus } from 'react-dom';
import { submitBooking, type BookingSubmitState } from '../actions';
import styles from '../booking.module.css';
import {
  BOOKING_ADDONS,
  BOOKING_CUT_TYPES,
  BOOKING_SIZE_OPTIONS,
  estimateReservationPrice,
  formatBookingCurrency,
  formatBookingDate,
  formatBookingMonthLabel,
  getAddonPriceTotal,
  getBasePriceForSize,
  getBookingMinDateKey,
  getCutTypeRecord,
  getFreeBookingSlots,
  getOpenBookingSlots,
  getSelectedAddonRecords,
  isBookingDateAllowed,
  isBookingDayBusy,
  isBookingSlotBusy,
  type BookingAddonCode,
  type BookingBusyInterval,
  type CutType,
  type DogSize,
} from '@/lib/booking';
import {
  validateBookingContactFields,
  type BookingContactField,
  type BookingContactFieldErrors,
} from '@/lib/validation/phone';
import { getBratislavaDateKey, getBratislavaWeekdayIndex } from '@/lib/time';

type StepKey = 1 | 2 | 3 | 4;

type CalendarCell = string | null;

const STEP_DEFINITIONS = [
  {
    step: 1,
    title: 'Pes',
    hint: 'Meno, plemeno a veľkosť.',
  },
  {
    step: 2,
    title: 'Služby',
    hint: 'Typ strihu a doplnky.',
  },
  {
    step: 3,
    title: 'Preferovaný termín',
    hint: 'Vyberiete deň a čas.',
  },
  {
    step: 4,
    title: 'Kontakt',
    hint: 'Pošleme potvrdenie telefonicky.',
  },
] as const;

const WEEKDAY_LABELS = ['Po', 'Ut', 'St', 'Št', 'Pi'] as const;

const INITIAL_STATE: BookingSubmitState = { status: 'idle' };

const CONTACT_FIELDS: BookingContactField[] = ['customerName', 'customerPhone', 'customerEmail'];

const EMPTY_CONTACT_ERRORS: BookingContactFieldErrors = {};

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function getMonthAnchorKey(dateKey: string): string {
  return `${dateKey.slice(0, 7)}-01`;
}

function addMonthsToMonthAnchorKey(monthAnchorKey: string, delta: number): string {
  const next = parseDateKey(monthAnchorKey);
  next.setUTCMonth(next.getUTCMonth() + delta);
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-01`;
}

function getMonthRange(monthAnchorKey: string): { from: string; to: string } {
  const start = parseDateKey(monthAnchorKey);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);

  return {
    from: monthAnchorKey,
    to: getBratislavaDateKey(end),
  };
}

function buildCalendarRows(monthAnchorKey: string): CalendarCell[][] {
  const monthStart = parseDateKey(monthAnchorKey);
  const firstDayWeekday = getBratislavaWeekdayIndex(monthStart);
  const monthStartWeek = new Date(monthStart);

  if (firstDayWeekday === 0) {
    monthStartWeek.setUTCDate(monthStartWeek.getUTCDate() + 1);
  } else {
    monthStartWeek.setUTCDate(monthStartWeek.getUTCDate() - (firstDayWeekday - 1));
  }

  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
  monthEnd.setUTCDate(0);
  const lastDayWeekday = getBratislavaWeekdayIndex(monthEnd);
  const monthEndWeek = new Date(monthEnd);

  if (lastDayWeekday === 0) {
    monthEndWeek.setUTCDate(monthEndWeek.getUTCDate() - 2);
  } else if (lastDayWeekday === 6) {
    monthEndWeek.setUTCDate(monthEndWeek.getUTCDate() - 1);
  } else if (lastDayWeekday < 5) {
    monthEndWeek.setUTCDate(monthEndWeek.getUTCDate() + (5 - lastDayWeekday));
  }

  const rows: CalendarCell[][] = [];
  for (
    let weekStart = new Date(monthStartWeek);
    weekStart <= monthEndWeek;
    weekStart.setUTCDate(weekStart.getUTCDate() + 7)
  ) {
    const row: CalendarCell[] = [];

    for (let offset = 0; offset < 5; offset += 1) {
      const cellDate = new Date(weekStart);
      cellDate.setUTCDate(cellDate.getUTCDate() + offset);
      const dateKey = getBratislavaDateKey(cellDate);
      const weekday = getBratislavaWeekdayIndex(cellDate);
      const isInMonth = dateKey.startsWith(monthAnchorKey.slice(0, 7));

      row.push(weekday >= 1 && weekday <= 5 && isInMonth ? dateKey : null);
    }

    rows.push(row);
  }

  return rows;
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
            className={styles.stepperButton}
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

function getOrderedAddonCodes(codes: BookingAddonCode[]): BookingAddonCode[] {
  return BOOKING_ADDONS.map((addon) => addon.code).filter((code) => codes.includes(code));
}

function getFirstContactErrorField(errors: BookingContactFieldErrors): BookingContactField | null {
  return CONTACT_FIELDS.find((field) => Boolean(errors[field])) ?? null;
}

export function BookingFlow() {
  const minDateKey = getBookingMinDateKey();
  const initialMonthAnchor = getMonthAnchorKey(minDateKey);

  const [step, setStep] = useState<StepKey>(1);
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogSize, setDogSize] = useState<DogSize>('SMALL');
  const [dogNote, setDogNote] = useState('');
  const [selectedCutType, setSelectedCutType] = useState<CutType | ''>('');
  const [selectedAddonCodes, setSelectedAddonCodes] = useState<BookingAddonCode[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(minDateKey);
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [company, setCompany] = useState('');
  const [clientFieldErrors, setClientFieldErrors] = useState<BookingContactFieldErrors>({});
  const [serviceFieldError, setServiceFieldError] = useState<string | null>(null);
  const [monthAnchorKey, setMonthAnchorKey] = useState(initialMonthAnchor);
  const [busyIntervals, setBusyIntervals] = useState<BookingBusyInterval[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [state, formAction] = useActionState(submitBooking, INITIAL_STATE);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const stepContentRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const formErrorRef = useRef<HTMLDivElement | null>(null);

  const monthRange = useMemo(() => getMonthRange(monthAnchorKey), [monthAnchorKey]);
  const serverFieldErrors = state.status === 'error' ? state.fieldErrors : EMPTY_CONTACT_ERRORS;
  const serverFormError = state.status === 'error' ? state.formError ?? null : null;
  const hasClientFieldErrors = Object.keys(clientFieldErrors).length > 0;
  const visibleFieldErrors = hasClientFieldErrors ? clientFieldErrors : serverFieldErrors;
  const visibleFormError = hasClientFieldErrors ? null : serverFormError;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(media.matches);

    sync();
    media.addEventListener('change', sync);

    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    const container = stepContentRef.current;
    if (!container) {
      return;
    }

    container.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    const focusTarget = container.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );

    focusTarget?.focus({ preventScroll: true });
  }, [prefersReducedMotion, step]);

  useEffect(() => {
    if (state.status !== 'error') {
      return;
    }

    if (Object.keys(serverFieldErrors).length > 0) {
      const firstErrorField = getFirstContactErrorField(serverFieldErrors);
      const input =
        firstErrorField === 'customerName'
          ? nameInputRef.current
          : firstErrorField === 'customerPhone'
            ? phoneInputRef.current
            : firstErrorField === 'customerEmail'
              ? emailInputRef.current
              : null;

      input?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      input?.focus({ preventScroll: true });
      return;
    }

    if (!serverFormError) {
      return;
    }

    formErrorRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    formErrorRef.current?.focus();
  }, [serverFieldErrors, serverFormError, state.status]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      try {
        const response = await fetch(
          `/api/availability?from=${encodeURIComponent(monthRange.from)}&to=${encodeURIComponent(monthRange.to)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Availability request failed with ${response.status}`);
        }

        const payload = (await response.json()) as unknown;

        if (!Array.isArray(payload)) {
          throw new Error('Invalid availability payload');
        }

        const intervals = payload.filter((item): item is BookingBusyInterval => {
          if (!item || typeof item !== 'object') {
            return false;
          }

          const record = item as Partial<BookingBusyInterval>;
          return (
            typeof record.date === 'string' &&
            typeof record.start === 'string' &&
            typeof record.end === 'string'
          );
        });

        if (isActive) {
          setBusyIntervals(intervals);
        }
      } catch (error) {
        if (!controller.signal.aborted && isActive) {
          console.error('Failed to load booking availability:', error);
          setBusyIntervals([]);
          setAvailabilityError('Obsadenosť sa nepodarilo načítať.');
        }
      } finally {
        if (!controller.signal.aborted && isActive) {
          setAvailabilityLoading(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [monthRange.from, monthRange.to]);

  const calendarRows = useMemo(() => buildCalendarRows(monthAnchorKey), [monthAnchorKey]);
  const openSlots = useMemo(() => getOpenBookingSlots(selectedDate), [selectedDate]);
  const freeSlots = useMemo(
    () => getFreeBookingSlots(selectedDate, busyIntervals),
    [busyIntervals, selectedDate],
  );
  const selectedDayBusy = useMemo(
    () => isBookingDayBusy(selectedDate, busyIntervals),
    [busyIntervals, selectedDate],
  );

  const selectedAddonRecords = useMemo(
    () => getSelectedAddonRecords(selectedAddonCodes),
    [selectedAddonCodes],
  );
  const selectedCutTypeRecord = useMemo(
    () => getCutTypeRecord(selectedCutType),
    [selectedCutType],
  );
  const selectedSizeRecord = useMemo(
    () => BOOKING_SIZE_OPTIONS.find((option) => option.value === dogSize) ?? BOOKING_SIZE_OPTIONS[0],
    [dogSize],
  );

  const basePrice = getBasePriceForSize(dogSize);
  const addonPrice = getAddonPriceTotal(selectedAddonCodes);
  const estimatedPrice = estimateReservationPrice(dogSize, selectedAddonCodes);
  const selectedAddonLabel =
    selectedAddonRecords.length > 0
      ? selectedAddonRecords.map((addon) => addon.label).join(', ')
      : 'Bez doplnkov';
  const selectedDateLabel = selectedDate ? formatBookingDate(selectedDate) : '—';
  const selectedTimeLabel = selectedTime || '—';
  const monthLabel = formatBookingMonthLabel(monthAnchorKey);
  const availabilityNote = availabilityLoading
    ? 'Obsadenosť načítavame.'
    : availabilityError
      ? availabilityError
      : 'Plne obsadené dni sú sivé a označené ako obsadené.';

  function canAdvanceFromStep(currentStep: StepKey): boolean {
    if (currentStep === 1) {
      return dogName.trim().length > 0 && dogBreed.trim().length > 0 && Boolean(dogSize);
    }

    if (currentStep === 2) {
      return Boolean(selectedCutType);
    }

    if (currentStep === 3) {
      return Boolean(selectedDate) && Boolean(selectedTime) && freeSlots.includes(selectedTime);
    }

    if (currentStep === 4) {
      return (
        Object.keys(
          validateBookingContactFields({
            customerName,
            customerPhone,
            customerEmail,
          }).fieldErrors,
        ).length === 0 &&
        Boolean(selectedDate) &&
        Boolean(selectedTime) &&
        Boolean(selectedCutType)
      );
    }

    return true;
  }

  function focusFirstInteractiveInStep() {
    const container = stepContentRef.current;
    if (!container) {
      return;
    }

    container.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    const firstInteractive = container.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );

    firstInteractive?.focus({ preventScroll: true });
  }

  function focusFirstContactError(errors: BookingContactFieldErrors) {
    const firstErrorField = getFirstContactErrorField(errors);
    const input =
      firstErrorField === 'customerName'
        ? nameInputRef.current
        : firstErrorField === 'customerPhone'
          ? phoneInputRef.current
          : firstErrorField === 'customerEmail'
            ? emailInputRef.current
            : null;

    input?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    input?.focus({ preventScroll: true });
  }

  function goNext() {
    if (!canAdvanceFromStep(step)) {
      if (step === 2) {
        setServiceFieldError('Vyberte typ strihu.');
        focusFirstInteractiveInStep();
      }

      if (step === 4) {
        const contactValidation = validateBookingContactFields({
          customerName,
          customerPhone,
          customerEmail,
        });

        setClientFieldErrors(contactValidation.fieldErrors);
        focusFirstContactError(contactValidation.fieldErrors);
      }

      return;
    }

    setClientFieldErrors({});
    setServiceFieldError(null);
    setStep((current) => Math.min(4, current + 1) as StepKey);
  }

  function goBack() {
    setClientFieldErrors({});
    setServiceFieldError(null);
    setStep((current) => Math.max(1, current - 1) as StepKey);
  }

  function handleToggleAddon(code: BookingAddonCode) {
    setSelectedAddonCodes((current) => {
      const next = current.includes(code)
        ? current.filter((value) => value !== code)
        : [...current, code];

      return getOrderedAddonCodes(next);
    });
  }

  function handleSelectDay(dateKey: string) {
    setSelectedDate(dateKey);
    setSelectedTime('');
    setMonthAnchorKey(getMonthAnchorKey(dateKey));
  }

  function handleMonthChange(delta: number) {
    setMonthAnchorKey((current) => addMonthsToMonthAnchorKey(current, delta));
  }

  if (state.status === 'success') {
    return (
      <section className={styles.confirmation} aria-live="polite">
        <div className={styles.confirmationCard}>
          <p className="eyebrow">Žiadosť prijatá</p>
          <h2>Ďakujeme, vašu žiadosť sme prijali.</h2>
          <p>Ozveme sa vám telefonicky a dohodneme termín.</p>
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
      <form className={`${styles.panel} ${styles.panelInner}`} action={formAction} noValidate>
        <input type="hidden" name="sourceCode" value="" />
        <input type="hidden" name="dogName" value={dogName} />
        <input type="hidden" name="dogBreed" value={dogBreed} />
        <input type="hidden" name="dogSize" value={dogSize} />
        <input type="hidden" name="dogNote" value={dogNote} />
        <input type="hidden" name="cutType" value={selectedCutType} />
        <input type="hidden" name="selectedDate" value={selectedDate} />
        <input type="hidden" name="selectedTime" value={selectedTime} />
        {selectedAddonCodes.map((serviceId) => (
          <input key={serviceId} type="hidden" name="serviceIds" value={serviceId} />
        ))}
        <input
          type="text"
          name="contact_time"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className={styles.honeypot}
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />

        <Stepper
          activeStep={step}
          onNavigate={(targetStep) => {
            setClientFieldErrors({});
            setServiceFieldError(null);
            setStep(targetStep);
          }}
        />

        <div className={styles.body}>
          {step === 1 ? (
            <>
              <div className={styles.sectionTitle}>
                <h2>Pes</h2>
                <span className={styles.sectionMeta}>Základné údaje o psovi.</span>
              </div>

              <div ref={stepContentRef as unknown as RefObject<HTMLDivElement>} className={styles.fieldGrid}>
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
                    {BOOKING_SIZE_OPTIONS.map((option) => (
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
                          onChange={() => setDogSize(option.value)}
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
                <span className={styles.sectionMeta}>Vyberiete typ strihu a doplnky.</span>
              </div>

              <div className={`${styles.serviceSummary} ${styles.serviceSummaryHidden}`}>
                <strong>
                  Orientačná cena základnej úpravy: {formatBookingCurrency(basePrice)} — konečná
                  cena podľa stavu srsti.
                </strong>
                <span>
                  {selectedCutTypeRecord?.label ?? 'Neviem — poradíte mi'} · Doplnky: {selectedAddonLabel}
                </span>
              </div>

              <fieldset
                ref={stepContentRef as unknown as RefObject<HTMLFieldSetElement>}
                className={styles.serviceSection}
              >
                <div className={styles.serviceSectionHead}>
                  <h3>Typ strihu</h3>
                  <p>Jedna možnosť podľa toho, čo bude pre psa najvhodnejšie.</p>
                </div>
                <div className={styles.sizeGrid}>
                  {BOOKING_CUT_TYPES.map((option) => (
                    <label
                      key={option.value}
                      className={`${styles.sizeCard} ${
                        selectedCutType === option.value ? styles.sizeCardSelected : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="cutType"
                        value={option.value}
                        checked={selectedCutType === option.value}
                        onChange={() => {
                          setSelectedCutType(option.value);
                          setServiceFieldError(null);
                        }}
                      />
                      <span className={styles.sizeCardTitle}>{option.label}</span>
                      <span className={styles.sizeCardNote}>{option.note}</span>
                    </label>
                  ))}
                </div>
                {serviceFieldError ? (
                  <p className={styles.fieldError} role="alert">
                    {serviceFieldError}
                  </p>
                ) : null}
              </fieldset>

              <div className={styles.serviceSection}>
                <div className={styles.serviceSectionHead}>
                  <h3>Doplnky</h3>
                  <p>Môžete pridať kúpanie, pazúriky alebo čistenie uší.</p>
                </div>
                <div className={styles.serviceGrid}>
                  {BOOKING_ADDONS.map((addon) => {
                    const isSelected = selectedAddonCodes.includes(addon.code);

                    return (
                      <label
                        key={addon.code}
                        className={`${styles.serviceCard} ${
                          isSelected ? styles.serviceCardSelected : ''
                        }`}
                      >
                        <input
                          className={styles.serviceInput}
                          type="checkbox"
                          name="serviceIds"
                          value={addon.code}
                          checked={isSelected}
                          onChange={() => handleToggleAddon(addon.code)}
                        />
                        <span className={styles.serviceCardCheck} aria-hidden="true" />
                        <span className={styles.serviceCardBody}>
                          <span className={styles.serviceCardTitle}>{addon.label}</span>
                          <span className={styles.serviceCardMeta}>
                            {formatBookingCurrency(addon.price)}
                          </span>
                          <span className={styles.serviceCardNote}>{addon.note}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className={styles.serviceSummary}>
                <strong>Orientačne spolu: {formatBookingCurrency(estimatedPrice)}</strong>
                <span>Konečná cena podľa stavu srsti.</span>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className={styles.sectionTitle}>
                <h2>Preferovaný termín</h2>
                <span className={styles.sectionMeta}>Termín vám potvrdíme telefonicky.</span>
              </div>

              <div ref={stepContentRef as unknown as RefObject<HTMLDivElement>} className={styles.calendar}>
                <div className={styles.calendarHeader}>
                  <div>
                    <div className={styles.monthTitle}>{monthLabel}</div>
                    <p className={styles.helperText}>Po – Pia · 10:00 – 13:00 a 14:00 – 18:00</p>
                  </div>
                  <div className={styles.monthNav}>
                    <button
                      type="button"
                      className={styles.monthNavButton}
                      onClick={() => handleMonthChange(-1)}
                      aria-label="Predchádzajúci mesiac"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className={styles.monthNavButton}
                      onClick={() => handleMonthChange(1)}
                      aria-label="Nasledujúci mesiac"
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div className={styles.weekdayRow} aria-hidden="true">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className={styles.weekdayCell}>
                      {label}
                    </div>
                  ))}
                </div>

                <div className={styles.dayGrid}>
                  {calendarRows.flatMap((row, rowIndex) =>
                    row.map((dateKey, cellIndex) => {
                      if (!dateKey) {
                        return <span key={`empty-${rowIndex}-${cellIndex}`} className={styles.dayPlaceholder} />;
                      }

                      const isAllowed = isBookingDateAllowed(dateKey);
                      const dayBusy = isBookingDayBusy(dateKey, busyIntervals);
                      const isSelected = selectedDate === dateKey;
                      const dayState = !isAllowed
                        ? 'od zajtra'
                        : dayBusy
                          ? 'obsadené'
                          : 'voľné';

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          className={`${styles.dayButton} ${
                            isSelected ? styles.dayButtonSelected : ''
                          } ${!isAllowed || dayBusy ? styles.dayButtonDisabled : ''}`}
                          disabled={!isAllowed || dayBusy}
                          onClick={() => handleSelectDay(dateKey)}
                        >
                          <span className={styles.dayNumber}>{dateKey.slice(-2)}</span>
                          <span className={styles.dayState}>{dayState}</span>
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>

              <div className={styles.slots}>
                <div className={styles.serviceSectionHead}>
                  <h3>Preferovaný čas</h3>
                  <p>Vyberte čas, ktorý vám najviac vyhovuje.</p>
                </div>
                <div className={styles.slotGrid}>
                  {openSlots.length > 0 ? (
                    openSlots.map((time) => {
                      const busy = isBookingSlotBusy(selectedDate, time, busyIntervals);
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          className={`${styles.slotButton} ${
                            isSelected ? styles.slotButtonSelected : ''
                          } ${busy ? styles.slotButtonBusy : ''}`}
                          onClick={() => {
                            if (!busy) {
                              setSelectedTime(time);
                            }
                          }}
                          disabled={busy}
                        >
                          <span className={styles.slotButtonTime}>{time}</span>
                          <span className={styles.slotButtonState}>
                            {busy ? 'obsadené' : 'voľné'}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className={styles.statusNote}>
                      Vyberte deň v pracovnom čase. Obsadenosť dní načítavame priebežne.
                    </p>
                  )}
                </div>
              </div>

              <p className={styles.statusNote}>
                {selectedDayBusy ? 'Vybraný deň je obsadený.' : availabilityNote}
              </p>
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
                      {dogName} · {dogBreed} · {selectedSizeRecord.label}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Typ strihu</span>
                    <span className={styles.summaryValue}>
                      {selectedCutTypeRecord?.label ?? 'Neviem — poradíte mi'}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Doplnky</span>
                    <span className={styles.summaryValue}>
                      {selectedAddonLabel}
                      {addonPrice > 0 ? ` · ${formatBookingCurrency(addonPrice)}` : ''}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Termín</span>
                    <span className={styles.summaryValue}>
                      {selectedDateLabel} · {selectedTimeLabel}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Orientačne spolu</span>
                    <span className={styles.summaryValue}>
                      {formatBookingCurrency(estimatedPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div ref={stepContentRef as unknown as RefObject<HTMLDivElement>} className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="customerName">
                    Meno
                  </label>
                  <input
                    ref={nameInputRef}
                    id="customerName"
                    name="customerName"
                    className={`${styles.input} ${visibleFieldErrors.customerName ? styles.inputError : ''}`}
                    value={customerName}
                    onChange={(event) => {
                      setCustomerName(event.target.value);
                      setClientFieldErrors((current) => {
                        if (!current.customerName) {
                          return current;
                        }

                        const next = { ...current };
                        delete next.customerName;
                        return next;
                      });
                    }}
                    autoComplete="name"
                    aria-invalid={Boolean(visibleFieldErrors.customerName)}
                    aria-describedby={visibleFieldErrors.customerName ? 'customerName-error' : undefined}
                    required
                  />
                  {visibleFieldErrors.customerName ? (
                    <p id="customerName-error" className={styles.fieldError}>
                      {visibleFieldErrors.customerName}
                    </p>
                  ) : null}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="customerPhone">
                    Telefón
                  </label>
                  <input
                    ref={phoneInputRef}
                    id="customerPhone"
                    name="customerPhone"
                    className={`${styles.input} ${visibleFieldErrors.customerPhone ? styles.inputError : ''}`}
                    value={customerPhone}
                    onChange={(event) => {
                      setCustomerPhone(event.target.value);
                      setClientFieldErrors((current) => {
                        if (!current.customerPhone) {
                          return current;
                        }

                        const next = { ...current };
                        delete next.customerPhone;
                        return next;
                      });
                    }}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+421 944 240 116"
                    aria-invalid={Boolean(visibleFieldErrors.customerPhone)}
                    aria-describedby={
                      visibleFieldErrors.customerPhone
                        ? 'customerPhone-hint customerPhone-error'
                        : 'customerPhone-hint'
                    }
                    required
                  />
                  <p id="customerPhone-hint" className={styles.helperText}>
                    Telefónne číslo potrebujeme na potvrdenie termínu — ozveme sa vám.
                  </p>
                  {visibleFieldErrors.customerPhone ? (
                    <p id="customerPhone-error" className={styles.fieldError}>
                      {visibleFieldErrors.customerPhone}
                    </p>
                  ) : null}
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label} htmlFor="customerEmail">
                    Email
                  </label>
                  <input
                    ref={emailInputRef}
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    className={`${styles.input} ${visibleFieldErrors.customerEmail ? styles.inputError : ''}`}
                    value={customerEmail}
                    onChange={(event) => {
                      setCustomerEmail(event.target.value);
                      setClientFieldErrors((current) => {
                        if (!current.customerEmail) {
                          return current;
                        }

                        const next = { ...current };
                        delete next.customerEmail;
                        return next;
                      });
                    }}
                    autoComplete="email"
                    placeholder="voliteľné"
                    aria-invalid={Boolean(visibleFieldErrors.customerEmail)}
                    aria-describedby={visibleFieldErrors.customerEmail ? 'customerEmail-error' : undefined}
                  />
                  {visibleFieldErrors.customerEmail ? (
                    <p id="customerEmail-error" className={styles.fieldError}>
                      {visibleFieldErrors.customerEmail}
                    </p>
                  ) : null}
                </div>
              </div>

              {visibleFormError ? (
                <div
                  ref={formErrorRef}
                  className={`${styles.alert} ${styles.alertError}`}
                  tabIndex={-1}
                  role="alert"
                  aria-live="assertive"
                >
                  {visibleFormError}
                </div>
              ) : null}

              <div className={styles.footerActions}>
                <button type="button" className="btn btn--ghost" onClick={goBack}>
                  Späť
                </button>
                <SubmitButton />
              </div>
            </>
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
            <span className={styles.summaryValue}>{selectedSizeRecord.label}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Typ strihu</span>
            <span className={styles.summaryValue}>
              {selectedCutTypeRecord?.label ?? 'Neviem — poradíte mi'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Doplnky</span>
            <span className={styles.summaryValue}>
              {selectedAddonLabel}
              {addonPrice > 0 ? ` · ${formatBookingCurrency(addonPrice)}` : ''}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termín</span>
            <span className={styles.summaryValue}>
              {selectedDateLabel} · {selectedTimeLabel}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Orientačne spolu</span>
            <span className={styles.summaryValue}>{formatBookingCurrency(estimatedPrice)}</span>
          </div>
          <div className={styles.summaryHint}>Konečná cena podľa stavu srsti.</div>
        </div>

        <div className={styles.summaryNote}>
          <strong>Otváracie hodiny</strong>
          <span>Po – Pia · 10:00 – 13:00 a 14:00 – 18:00</span>
        </div>
      </aside>
    </div>
  );
}
