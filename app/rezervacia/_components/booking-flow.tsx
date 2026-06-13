'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { submitBooking, type BookingSubmitState } from '../actions';
import styles from '../booking.module.css';
import {
  formatBookingCurrency,
  formatBookingDate,
  formatBookingMonthLabel,
  getBasePriceForSize,
  getBookingEstimate,
  getBookingMinDateKey,
  getFreeBookingSlots,
  isBookingDateAllowed,
  isBookingDayBusy,
  isBookingSlotBusy,
  type BookingAddonCode,
  type BookingBusyInterval,
  type CutType,
  type DogSize,
} from '@/lib/booking';
import { addDaysToDateKey, getBratislavaDateKey, getBratislavaWeekdayIndex } from '@/lib/time';
import {
  normalizeSlovakPhone,
  SLOVAK_PHONE_E164_PATTERN,
  type BookingContactFieldErrors,
} from '@/lib/validation/phone';

type StepKey = 1 | 2 | 3 | 4;
type CalendarCell = string | null;
type SummaryItem = {
  label: string;
  value: string;
};

type BookingFlowProps = {
  initialCompleted?: boolean;
};

const STEP_DEFINITIONS = [
  { step: 1, title: 'Termín', hint: 'Kalendár a výber času.' },
  { step: 2, title: 'Pes', hint: 'Meno, plemeno a veľkosť.' },
  { step: 3, title: 'Služba', hint: 'Strih a doplnky.' },
  { step: 4, title: 'Kontakt', hint: 'Údaje a odoslanie.' },
] as const;

const WEEKDAY_LABELS = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'] as const;

const MORNING_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30'] as const;
const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'] as const;

const SIZE_OPTIONS = [
  { value: 'SMALL', label: 'Malý', note: 'Do ~10 kg.' },
  { value: 'MEDIUM', label: 'Stredný', note: '10–25 kg.' },
  { value: 'LARGE', label: 'Veľký', note: 'Nad 25 kg.' },
] as const satisfies readonly {
  value: DogSize;
  label: string;
  note: string;
}[];

const CUT_TYPE_OPTIONS = [
  {
    value: 'SHORT',
    label: 'Krátky strih',
    note: 'Praktické skrátenie srsti.',
  },
  {
    value: 'STANDARD',
    label: 'Plný / štandardný strih',
    note: 'Klasická úprava podľa stavu srsti.',
  },
  {
    value: 'NO_CUT',
    label: 'Úprava bez strihania',
    note: 'Len vyčesanie. Kúpanie si pridajte samostatne v doplnkoch, ak ho chcete.',
  },
  {
    value: 'A_LA_CARTE',
    label: 'A la carte',
    note: 'Nadštandardná úprava.',
    priceLabel: 'Orientačne 80 €',
  },
  {
    value: 'ADVICE',
    label: 'Neviem - poraďte mi',
    note: 'Spolu vyberieme vhodný postup.',
  },
] as const satisfies readonly {
  value: CutType;
  label: string;
  note: string;
  priceLabel?: string;
}[];

const ADDON_OPTIONS = [
  {
    code: 'BATH',
    label: 'Kúpanie',
    note: 'Starostlivosť podľa stavu srsti.',
    price: 15,
  },
  {
    code: 'NAILS',
    label: 'Pazúriky',
    note: 'Rýchla úprava pazúrikov.',
    price: 5,
  },
  {
    code: 'EARS',
    label: 'Čistenie uší',
    note: 'Šetrné čistenie podľa potreby.',
    price: 5,
  },
] as const satisfies readonly {
  code: BookingAddonCode;
  label: string;
  note: string;
  price: number;
}[];

const INITIAL_STATE: BookingSubmitState = { status: 'idle' };
const GENERIC_SUBMIT_ERROR =
  'Žiadosť sa nepodarilo odoslať. Skúste to znova alebo zavolajte na +421 944 240 116.';
const PHONE_DISPLAY = '+421 944 240 116';
const PHONE_HREF = 'tel:+421944240116';
const BOOKING_MAX_ADVANCE_DAYS = 56;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
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

function buildCalendarRows(monthAnchorKey: string): CalendarCell[][] {
  const monthStart = parseDateKey(monthAnchorKey);
  const firstDayWeekday = getBratislavaWeekdayIndex(monthStart);
  const monthStartWeek = new Date(monthStart);
  const daysToStart = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
  monthStartWeek.setUTCDate(monthStartWeek.getUTCDate() - daysToStart);

  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
  monthEnd.setUTCDate(0);
  const lastDayWeekday = getBratislavaWeekdayIndex(monthEnd);
  const monthEndWeek = new Date(monthEnd);
  if (lastDayWeekday !== 0) {
    monthEndWeek.setUTCDate(monthEndWeek.getUTCDate() + (7 - lastDayWeekday));
  }

  const rows: CalendarCell[][] = [];
  for (
    let weekStart = new Date(monthStartWeek);
    weekStart <= monthEndWeek;
    weekStart.setUTCDate(weekStart.getUTCDate() + 7)
  ) {
    const row: CalendarCell[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const cellDate = new Date(weekStart);
      cellDate.setUTCDate(cellDate.getUTCDate() + offset);
      const dateKey = getBratislavaDateKey(cellDate);
      row.push(dateKey.startsWith(monthAnchorKey.slice(0, 7)) ? dateKey : null);
    }
    rows.push(row);
  }

  return rows;
}

function formatCompactDateLabel(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return '—';
  }

  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  }).format(parseDateKey(dateKey));
}

function validateContactFields(input: {
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  privacyConsent: boolean;
}): {
  fieldErrors: BookingContactFieldErrors;
  normalizedPhone: string;
} {
  const fieldErrors: BookingContactFieldErrors = {};
  const trimmedFirstName = input.customerFirstName.trim();
  const trimmedLastName = input.customerLastName.trim();
  const trimmedPhone = input.customerPhone.trim();
  const trimmedEmail = input.customerEmail.trim();
  const normalizedPhone = normalizeSlovakPhone(trimmedPhone);

  if (!trimmedFirstName) {
    fieldErrors.customerFirstName = 'Zadajte meno.';
  }

  if (!trimmedLastName) {
    fieldErrors.customerLastName = 'Zadajte priezvisko.';
  }

  if (!trimmedPhone) {
    fieldErrors.customerPhone = 'Zadajte telefónne číslo.';
  } else if (!normalizedPhone || !SLOVAK_PHONE_E164_PATTERN.test(normalizedPhone)) {
    fieldErrors.customerPhone =
      'Skontrolujte telefónne číslo. Použite napríklad 0911 925 373 alebo +421 911 925 373.';
  }

  if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
    fieldErrors.customerEmail = 'Skontrolujte formát emailu.';
  }

  if (!input.privacyConsent) {
    fieldErrors.privacyConsent = 'Potvrďte prosím súhlas so spracovaním osobných údajov pre rezerváciu.';
  }

  return { fieldErrors, normalizedPhone };
}

function Stepper({ activeStep }: { activeStep: StepKey }) {
  return (
    <nav className={styles.stepper} aria-label="Postup rezervácie">
      <div className={styles.stepperCurrent}>
        <div className={styles.stepperHeading}>
          <span className={styles.stepNumber}>{activeStep}</span>
          <div className={styles.stepText}>
            <span className={styles.stepLabel}>{STEP_DEFINITIONS[activeStep - 1].title}</span>
            <span className={styles.stepHint}>{STEP_DEFINITIONS[activeStep - 1].hint}</span>
          </div>
        </div>
        <p className={styles.stepProgress}>Krok {activeStep} zo 4</p>
      </div>

      <div className={styles.stepperDots} role="list" aria-label="Kroky rezervácie">
        {STEP_DEFINITIONS.map((item) => (
          <span
            key={item.step}
            role="listitem"
            aria-current={activeStep === item.step ? 'step' : undefined}
            className={`${styles.stepperDot} ${activeStep === item.step ? styles.stepperDotActive : ''}`}
          />
        ))}
      </div>
    </nav>
  );
}

function SummaryRows({
  items,
}: {
  items: SummaryItem[];
}) {
  return (
    <div className={styles.summaryStack}>
      {items.map((item) => (
        <div className={styles.summaryItem} key={item.label}>
          <span className={styles.summaryLabel}>{item.label}</span>
          <span className={styles.summaryValue}>{item.value}</span>
        </div>
      ))}
    </div>
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

function getMobileSummaryItem(
  step: StepKey,
  entries: SummaryItem[],
  customerFullName: string,
): SummaryItem | null {
  if (step >= 4 && customerFullName.trim()) {
    return { label: 'Kontakt', value: customerFullName.trim() };
  }

  if (step >= 3) {
    const service = entries.find((entry) => entry.label === 'Služba');
    if (service && service.value !== '—') {
      return service;
    }
  }

  if (step >= 2) {
    const dog = entries.find((entry) => entry.label === 'Pes');
    if (dog && dog.value !== '?') {
      return dog;
    }
  }

  return entries.find((entry) => entry.label === 'Termín' && entry.value !== '—') ?? null;
}


export function BookingFlow({ initialCompleted = false }: BookingFlowProps) {
  const minDateKey = getBookingMinDateKey();
  const maxDateKey = addDaysToDateKey(minDateKey, BOOKING_MAX_ADVANCE_DAYS);
  const minMonthAnchor = getMonthAnchorKey(minDateKey);
  const maxMonthAnchor = getMonthAnchorKey(maxDateKey);

  const [step, setStep] = useState<StepKey>(1);
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogSize, setDogSize] = useState<DogSize | ''>('');
  const [selectedCutType, setSelectedCutType] = useState<CutType | ''>('');
  const [selectedAddonCodes, setSelectedAddonCodes] = useState<BookingAddonCode[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [monthAnchorKey, setMonthAnchorKey] = useState(minMonthAnchor);
  const [busyIntervals, setBusyIntervals] = useState<BookingBusyInterval[]>([]);
  const [selectedDateBusyIntervals, setSelectedDateBusyIntervals] = useState<BookingBusyInterval[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [selectedDateAvailabilityLoading, setSelectedDateAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedDateAvailabilityError, setSelectedDateAvailabilityError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [clientFieldErrors, setClientFieldErrors] = useState<BookingContactFieldErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [state, formAction] = useActionState(submitBooking, INITIAL_STATE);
  const isSuccessView = initialCompleted || state.status === 'success';
  const stepOneRef = useRef<HTMLDivElement | null>(null);
  const stepTwoRef = useRef<HTMLDivElement | null>(null);
  const stepThreeRef = useRef<HTMLDivElement | null>(null);
  const stepFourRef = useRef<HTMLDivElement | null>(null);
  const confirmationRef = useRef<HTMLDivElement | null>(null);
  const timeSectionRef = useRef<HTMLDivElement | null>(null);
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);
  const lastNameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const privacyConsentRef = useRef<HTMLInputElement | null>(null);
  const formErrorRef = useRef<HTMLDivElement | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const basePrice = dogSize ? getBasePriceForSize(dogSize) : null;
  const bookingEstimate =
    dogSize && selectedCutType ? getBookingEstimate(dogSize, selectedCutType, selectedAddonCodes) : null;
  const estimatedPrice = bookingEstimate?.price ?? (dogSize ? getBookingEstimate(dogSize, 'STANDARD', selectedAddonCodes).price : 0);
  const customerFullName = [customerFirstName.trim(), customerLastName.trim()].filter(Boolean).join(' ');

  const selectedCutTypeRecord = useMemo(
    () => CUT_TYPE_OPTIONS.find((option) => option.value === selectedCutType) ?? null,
    [selectedCutType],
  );
  const selectedSizeRecord = useMemo(
    () => SIZE_OPTIONS.find((option) => option.value === dogSize) ?? null,
    [dogSize],
  );
  const selectedAddonRecords = useMemo(
    () => ADDON_OPTIONS.filter((addon) => selectedAddonCodes.includes(addon.code)),
    [selectedAddonCodes],
  );
  const monthLabel = useMemo(() => formatBookingMonthLabel(monthAnchorKey), [monthAnchorKey]);
  const calendarRows = useMemo(() => buildCalendarRows(monthAnchorKey), [monthAnchorKey]);
  const freeSlots = useMemo(
    () => getFreeBookingSlots(selectedDate, [...busyIntervals, ...selectedDateBusyIntervals]),
    [busyIntervals, selectedDate, selectedDateBusyIntervals],
  );
  const selectedDayBusy = useMemo(
    () => isBookingDayBusy(selectedDate, [...busyIntervals, ...selectedDateBusyIntervals]),
    [busyIntervals, selectedDate, selectedDateBusyIntervals],
  );

  const canGoPrev = monthAnchorKey > minMonthAnchor;
  const canGoNext = monthAnchorKey < maxMonthAnchor;
  const selectedDateLabel = selectedDate ? formatBookingDate(selectedDate) : '—';
  const selectedTimeLabel = selectedTime || '—';
  const compactDateLabel = selectedDate ? formatCompactDateLabel(selectedDate) : '—';

  const summaryItems: SummaryItem[] = [
    {
      label: 'Termín',
      value: selectedDate !== '' && selectedTime !== '' ? `${selectedDateLabel} · ${selectedTimeLabel}` : '—',
    },
    {
      label: 'Pes',
      value: dogName.trim() || '?',
    },
    {
      label: 'Veľkosť',
      value: selectedSizeRecord?.label ?? '—',
    },
    {
      label: 'Služba',
      value: selectedCutTypeRecord?.label ?? '—',
    },
    {
      label: 'Doplnky',
      value:
        selectedAddonRecords.length > 0
          ? selectedAddonRecords.map((addon) => addon.label).join(', ')
          : 'Bez doplnkov',
    },
  ];

  const mobileSummary = getMobileSummaryItem(step, summaryItems, customerFullName);

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
    if (isSuccessView) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubmissionError(null);
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      confirmationRef.current?.focus({ preventScroll: true });
      return;
    }

    if (state.status === 'error') {
      setSubmissionError(GENERIC_SUBMIT_ERROR);
    }
  }, [isSuccessView, prefersReducedMotion, state.status]);

  useEffect(() => {
    if (isSuccessView) {
      return;
    }

    const target = step === 1 ? stepOneRef.current : step === 2 ? stepTwoRef.current : step === 3 ? stepThreeRef.current : stepFourRef.current;

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });

    target.focus({ preventScroll: true });
  }, [isSuccessView, prefersReducedMotion, step]);

  useEffect(() => {
    if (isSuccessView) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function loadMonthAvailability() {
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      try {
        const monthStart = parseDateKey(monthAnchorKey);
        const monthEnd = new Date(monthStart);
        monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
        monthEnd.setUTCDate(0);
        const response = await fetch(
          `/api/availability?from=${encodeURIComponent(monthAnchorKey)}&to=${encodeURIComponent(
            getBratislavaDateKey(monthEnd),
          )}`,
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

        if (active) {
          setBusyIntervals(intervals);
        }
      } catch (error) {
        if (!controller.signal.aborted && active) {
          console.error('Failed to load booking availability:', error);
          setBusyIntervals([]);
          setAvailabilityError('Obsadenosť sa nepodarilo načítať.');
        }
      } finally {
        if (!controller.signal.aborted && active) {
          setAvailabilityLoading(false);
        }
      }
    }

    void loadMonthAvailability();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isSuccessView, monthAnchorKey]);

  useEffect(() => {
    if (isSuccessView) {
      return;
    }

    if (!selectedDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDateBusyIntervals([]);
      setSelectedDateAvailabilityError(null);
      setSelectedDateAvailabilityLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function loadSelectedDateAvailability() {
      setSelectedDateAvailabilityLoading(true);
      setSelectedDateAvailabilityError(null);

      try {
        const response = await fetch(
          `/api/availability?from=${encodeURIComponent(selectedDate)}&to=${encodeURIComponent(selectedDate)}`,
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

        if (active) {
          setSelectedDateBusyIntervals(intervals);
        }
      } catch (error) {
        if (!controller.signal.aborted && active) {
          console.error('Failed to load booking availability for selected date:', error);
          setSelectedDateBusyIntervals([]);
          setSelectedDateAvailabilityError('Obsadenosť pre vybraný deň sa nepodarilo načítať.');
        }
      } finally {
        if (!controller.signal.aborted && active) {
          setSelectedDateAvailabilityLoading(false);
        }
      }
    }

    void loadSelectedDateAvailability();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isSuccessView, selectedDate]);

  useEffect(() => {
    return () => {
      clearAdvanceTimer();
    };
  }, []);

  function isSelectableDate(dateKey: string): boolean {
    return dateKey >= minDateKey && dateKey <= maxDateKey && isBookingDateAllowed(dateKey);
  }

  function handleMonthChange(delta: number) {
    const next = addMonthsToMonthAnchorKey(monthAnchorKey, delta);
    if (next < minMonthAnchor || next > maxMonthAnchor) {
      return;
    }

    setMonthAnchorKey(next);
  }

  function handleSelectDay(dateKey: string) {
    if (!isSelectableDate(dateKey) || isBookingDayBusy(dateKey, busyIntervals)) {
      return;
    }

    setSelectedDate(dateKey);
    setSelectedTime('');
    setStep(1);
    setStepError(null);
    setSubmissionError(null);
    window.requestAnimationFrame(() => {
      timeSectionRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  function handleSelectTime(time: string) {
    if (!selectedDate) {
      return;
    }

    if (isBookingSlotBusy(selectedDate, time, [...busyIntervals, ...selectedDateBusyIntervals])) {
      return;
    }

    setSelectedTime(time);
    setStepError(null);
    setSubmissionError(null);

    clearAdvanceTimer();
    advanceTimerRef.current = window.setTimeout(() => {
      setStep(2);
    }, 300);
  }

  function handleAddonToggle(code: BookingAddonCode) {
    setSelectedAddonCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  function goBack() {
    setStep((current) => (current > 1 ? ((current - 1) as StepKey) : current));
    setStepError(null);
    setSubmissionError(null);
  }

  function goNext() {
    if (step === 2) {
      if (!dogName.trim() || !dogSize) {
        setStepError('Zadajte meno psa a vyberte veľkosť.');
        return;
      }

      setStepError(null);
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!selectedCutType) {
        setStepError('Vyberte typ strihu.');
        return;
      }

      setStepError(null);
      setStep(4);
    }
  }

  function focusFirstContactError(errors: BookingContactFieldErrors) {
    if (errors.customerFirstName) {
      firstNameInputRef.current?.focus({ preventScroll: true });
      return;
    }

    if (errors.customerLastName) {
      lastNameInputRef.current?.focus({ preventScroll: true });
      return;
    }

    if (errors.customerPhone) {
      phoneInputRef.current?.focus({ preventScroll: true });
      return;
    }

    if (errors.customerEmail) {
      emailInputRef.current?.focus({ preventScroll: true });
      return;
    }

    if (errors.privacyConsent) {
      privacyConsentRef.current?.focus({ preventScroll: true });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const latestContactValidation = validateContactFields({
      customerFirstName,
      customerLastName,
      customerPhone,
      customerEmail,
      privacyConsent,
    });

    if (!selectedDate || !selectedTime || !selectedCutType || !dogName.trim() || !dogSize) {
      event.preventDefault();
      setStepError('Skontrolujte prosím termín, psa a službu.');
      setSubmissionError(null);
      return;
    }

    if (!selectedDate || !selectedTime || freeSlots.length === 0 || !freeSlots.includes(selectedTime)) {
      event.preventDefault();
      setSubmissionError('Vybraný termín sa zmenil. Vyberte ho znova.');
      return;
    }

    if (Object.keys(latestContactValidation.fieldErrors).length > 0) {
      event.preventDefault();
      setClientFieldErrors(latestContactValidation.fieldErrors);
      setSubmissionError(null);
      focusFirstContactError(latestContactValidation.fieldErrors);
      return;
    }

    setClientFieldErrors({});
    setStepError(null);
    setSubmissionError(null);
  }

  if (isSuccessView) {
    return (
      <div className={styles.confirmation}>
        <div ref={confirmationRef} className={styles.confirmationCard} tabIndex={-1}>
          <p className={styles.eyebrow}>Žiadosť odoslaná</p>
          <h2>Termín Vám potvrdíme.</h2>
          <p>
            Ozveme sa Vám čo najskôr a termín potvrdíme. Ak sa ponáhľate, zavolajte nám priamo.
          </p>
          <a className="btn btn--primary" href={PHONE_HREF}>
            Zavolať {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    );
  }

  const summaryEntries = summaryItems;
  const recapItems: SummaryItem[] = [
    {
      label: 'Termín',
      value: selectedDate && selectedTime ? `${compactDateLabel} · ${selectedTime}` : '—',
    },
    {
      label: 'Pes',
      value: dogName.trim() ? (dogBreed.trim() ? `${dogName.trim()} · ${dogBreed.trim()}` : dogName.trim()) : '—',
    },
    {
      label: 'Služba',
      value: selectedCutTypeRecord?.label ?? '—',
    },
  ];

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <p className={styles.eyebrow}>Rezervácia termínu</p>
          <h1>Žiadosť o termín pre psí salón</h1>
          <p className={styles.subtitle}>
            Vyberte si termín, doplňte údaje o psovi a odošlite žiadosť. Termín vám potvrdíme.
          </p>
        </div>
      </section>

      <div className={styles.wizardShell}>
      <form className={styles.panel} action={formAction} noValidate onSubmit={handleSubmit}>
        <div className={styles.panelInner}>
          <div className={styles.mobileSummary} aria-live="polite">
            {mobileSummary ? (
              <div className={styles.mobileSummaryCard}>
                <span className={styles.mobileSummaryLabel}>{mobileSummary.label}</span>
                <span className={styles.mobileSummaryValue}>{mobileSummary.value}</span>
                <span className={styles.mobileSummaryMeta}>Najnovší vybraný krok</span>
              </div>
            ) : (
              <div className={styles.mobileSummaryCard}>
                <span className={styles.mobileSummaryLabel}>Termín</span>
                <span className={styles.mobileSummaryValue}>Vyberte si preferovaný termín</span>
              </div>
            )}
          </div>

          <input type="hidden" name="sourceCode" value="" />
          <input type="hidden" name="dogNote" value="" />
          <input type="hidden" name="selectedDate" value={selectedDate} />
          <input type="hidden" name="selectedTime" value={selectedTime} />
          <input type="hidden" name="contact_time" value="" />

          <Stepper activeStep={step} />

          <div
            ref={stepOneRef}
            className={`${styles.stepPane} ${step === 1 ? styles.stepPaneVisible : styles.stepPaneHidden}`}
            tabIndex={-1}
          >
            <div className={styles.sectionTitle}>
              <div>
                <p className={styles.stepKicker}>Krok 1 zo 4</p>
                <h2>Termín</h2>
              </div>
              <span className={styles.sectionMeta}>
                Vyberte si preferovaný termín. Termín Vám potvrdíme po odoslaní žiadosti.
              </span>
            </div>

            <div className={styles.calendar}>
              <div className={styles.calendarHeader}>
                <div>
                  <div className={styles.monthTitle}>{monthLabel}</div>
                  <p className={styles.helperText}>
                    Po – Pia · 10:00 – 13:00 a 14:00 – 18:00
                  </p>
                </div>
                <div className={styles.monthNav}>
                  <button
                    type="button"
                    className={styles.monthNavButton}
                    onClick={() => handleMonthChange(-1)}
                    disabled={!canGoPrev}
                    aria-label="Predchádzajúci mesiac"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={styles.monthNavButton}
                    onClick={() => handleMonthChange(1)}
                    disabled={!canGoNext}
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

                    const allowed = isSelectableDate(dateKey);
                    const busy = isBookingDayBusy(dateKey, [...busyIntervals, ...selectedDateBusyIntervals]);
                    const selected = selectedDate === dateKey;
                    const dayState = !allowed ? 'Mimo rozsahu' : busy ? 'Obsadené' : 'Voľné';

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        className={`${styles.dayButton} ${selected ? styles.dayButtonSelected : ''} ${
                          !allowed || busy ? styles.dayButtonDisabled : ''
                        }`}
                        disabled={!allowed || busy}
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

          <div ref={timeSectionRef} className={styles.slots}>
              <div className={styles.serviceSectionHead}>
                <h3>Vyberte preferovaný čas</h3>
                <p>Vyberte časový slot. Dopoludnia a popoludní sú rozdelené zvlášť.</p>
              </div>

              {selectedDate ? (
                <>
                  <div className={styles.serviceSectionHead}>
                    <h3>Dopoludnia</h3>
                    <p>10:00 – 12:30</p>
                  </div>
                  <div className={styles.slotGrid}>
                    {MORNING_SLOTS.map((time) => {
                      const busy = isBookingSlotBusy(selectedDate, time, [...busyIntervals, ...selectedDateBusyIntervals]);
                      const selected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          className={`${styles.slotButton} ${selected ? styles.slotButtonSelected : ''} ${
                            busy ? styles.slotButtonBusy : ''
                          }`}
                          onClick={() => handleSelectTime(time)}
                          disabled={busy}
                        >
                          <span className={styles.slotButtonTime}>{time}</span>
                          <span className={styles.slotButtonState}>{busy ? 'obsadené' : 'voľné'}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.serviceSectionHead}>
                    <h3>Popoludní</h3>
                    <p>14:00 – 17:30</p>
                  </div>
                  <div className={styles.slotGrid}>
                    {AFTERNOON_SLOTS.map((time) => {
                      const busy = isBookingSlotBusy(selectedDate, time, [...busyIntervals, ...selectedDateBusyIntervals]);
                      const selected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          className={`${styles.slotButton} ${selected ? styles.slotButtonSelected : ''} ${
                            busy ? styles.slotButtonBusy : ''
                          }`}
                          onClick={() => handleSelectTime(time)}
                          disabled={busy}
                        >
                          <span className={styles.slotButtonTime}>{time}</span>
                          <span className={styles.slotButtonState}>{busy ? 'obsadené' : 'voľné'}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className={styles.statusNote}>Najprv vyberte deň v kalendári.</p>
              )}

              <p className={styles.statusNote}>
                {!selectedDate
                  ? availabilityLoading
                    ? 'Obsadenosť načítavame.'
                    : availabilityError ?? 'Plne obsadené dni sú sivé a označené ako obsadené.'
                  : selectedDateAvailabilityLoading
                    ? 'Obsadenosť pre vybraný deň načítavame.'
                    : selectedDateAvailabilityError
                      ? selectedDateAvailabilityError
                      : selectedDayBusy
                        ? 'Vybraný deň je obsadený.'
                        : selectedTime
                          ? freeSlots.includes(selectedTime)
                            ? 'Termín je voľný.'
                            : 'Vybraný čas je obsadený.'
                          : 'Potom vyberte časový slot.'}
              </p>
            </div>
          </div>

          <div
            ref={stepTwoRef}
            className={`${styles.stepPane} ${step === 2 ? styles.stepPaneVisible : styles.stepPaneHidden}`}
            tabIndex={-1}
          >
            <div className={styles.sectionTitle}>
              <div>
                <p className={styles.stepKicker}>Krok 2 zo 4</p>
                <h2>Pes</h2>
              </div>
              <span className={styles.sectionMeta}>Doplňte meno, plemeno a veľkosť psa.</span>
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
                  onChange={(event) => {
                    setDogName(event.target.value);
                    setStepError(null);
                  }}
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
                  placeholder="Napr. yorkshirský teriér"
                  required
                />
                <p className={styles.helperText}>Povinné pole.</p>
              </div>
            </div>

            <div className={styles.serviceSection}>
              <div className={styles.serviceSectionHead}>
                <h3>Veľkosť</h3>
                <p>Vyberte veľkosť podľa približnej hmotnosti psa.</p>
              </div>

              <div className={styles.sizeGrid}>
                {SIZE_OPTIONS.map((option) => {
                  const selected = dogSize === option.value;
                  return (
                    <label key={option.value} className={`${styles.sizeCard} ${selected ? styles.sizeCardSelected : ''}`}>
                      <input
                        type="radio"
                        name="dogSize"
                        value={option.value}
                        checked={selected}
                        onChange={() => {
                          setDogSize(option.value);
                          setSelectedCutType('');
                          setStepError(null);
                        }}
                        required
                      />
                      <span className={styles.sizeCardTitle}>{option.label}</span>
                      <span className={styles.sizeCardNote}>{option.note}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {stepError ? <div className={`${styles.alert} ${styles.alertError}`}>{stepError}</div> : null}

            <div className={styles.footerActions}>
              <button type="button" className="btn btn--ghost" onClick={goBack}>
                Späť
              </button>
              <button type="button" className="btn btn--primary" onClick={goNext}>
                Pokračovať
              </button>
            </div>
          </div>

          <div
            ref={stepThreeRef}
            className={`${styles.stepPane} ${step === 3 ? styles.stepPaneVisible : styles.stepPaneHidden}`}
            tabIndex={-1}
          >
            <div className={styles.sectionTitle}>
              <div>
                <p className={styles.stepKicker}>Krok 3 zo 4</p>
                <h2>Služba</h2>
              </div>
              <span className={styles.sectionMeta}>
                {selectedSizeRecord
                  ? `Ceny sa orientačne začínajú na ${formatBookingCurrency(basePrice ?? 0)}.`
                  : 'Najprv vyberte veľkosť psa.'}
              </span>
            </div>

            <div className={styles.serviceSection}>
              <div className={styles.serviceSectionHead}>
                <h3>Typ strihu</h3>
                <p>Konečnú cenu upresníme podľa stavu srsti.</p>
              </div>

              <div className={styles.serviceGrid}>
                {CUT_TYPE_OPTIONS.map((option) => {
                  const selected = selectedCutType === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`${styles.serviceCard} ${selected ? styles.serviceCardSelected : ''}`}
                    >
                      <input
                        type="radio"
                        name="cutType"
                        value={option.value}
                        checked={selected}
                        onChange={() => {
                          setSelectedCutType(option.value);
                          setStepError(null);
                        }}
                        className={styles.serviceInput}
                        required
                      />
                      <span className={styles.serviceCardCheck} aria-hidden="true" />
                      <span className={styles.serviceCardBody}>
                        <span className={styles.serviceCardTitle}>{option.label}</span>
                        <span className={styles.serviceCardMeta}>
                          {selectedSizeRecord
                            ? ('priceLabel' in option ? option.priceLabel : undefined) ?? `od ${formatBookingCurrency(basePrice ?? 0)}`
                            : 'Vyberte ve?kos? psa'}
                        </span>
                        <span className={styles.serviceCardNote}>{option.note}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.serviceSection}>
              <div className={styles.serviceSectionHead}>
                <h3>Doplnky</h3>
                <p>Pridajte len to, čo má pre psa zmysel.</p>
              </div>

              <div className={styles.serviceGrid}>
                {ADDON_OPTIONS.map((addon) => {
                  const selected = selectedAddonCodes.includes(addon.code);

                  return (
                    <label key={addon.code} className={`${styles.serviceCard} ${selected ? styles.serviceCardSelected : ''}`}>
                      <input
                        type="checkbox"
                        name="serviceIds"
                        value={addon.code}
                        checked={selected}
                        onChange={() => handleAddonToggle(addon.code)}
                        className={styles.serviceInput}
                      />
                      <span className={styles.serviceCardCheck} aria-hidden="true" />
                      <span className={styles.serviceCardBody}>
                        <span className={styles.serviceCardTitle}>{addon.label}</span>
                        <span className={styles.serviceCardMeta}>{formatBookingCurrency(addon.price)}</span>
                        <span className={styles.serviceCardNote}>{addon.note}</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className={styles.serviceSummary}>
                <strong>Orientačne spolu: {formatBookingCurrency(estimatedPrice)}</strong>
                <span>Konečnú cenu upresníme podľa stavu srsti.</span>
              </div>
            </div>

            {stepError ? <div className={`${styles.alert} ${styles.alertError}`}>{stepError}</div> : null}

            <div className={styles.footerActions}>
              <button type="button" className="btn btn--ghost" onClick={goBack}>
                Späť
              </button>
              <button type="button" className="btn btn--primary" onClick={goNext}>
                Pokračovať
              </button>
            </div>
          </div>

          <div
            ref={stepFourRef}
            className={`${styles.stepPane} ${step === 4 ? styles.stepPaneVisible : styles.stepPaneHidden}`}
            tabIndex={-1}
          >
            <div className={styles.sectionTitle}>
              <div>
                <p className={styles.stepKicker}>Krok 4 zo 4</p>
                <h2>Kontakt</h2>
              </div>
              <span className={styles.sectionMeta}>Skontrolujte súhrn a odošlite žiadosť.</span>
            </div>

            <div className={styles.recapBox}>
              <div className={styles.recapRows}>
                {recapItems.map((item) => (
                  <div key={item.label} className={styles.recapRow}>
                    <span className={styles.summaryLabel}>{item.label}</span>
                    <span className={styles.summaryValue}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="customerFirstName">
                  Meno
                </label>
                <input
                  ref={firstNameInputRef}
                  id="customerFirstName"
                  name="customerFirstName"
                  className={`${styles.input} ${clientFieldErrors.customerFirstName ? styles.inputError : ''}`}
                  value={customerFirstName}
                  onChange={(event) => {
                    setCustomerFirstName(event.target.value);
                    setClientFieldErrors((current) => {
                      if (!current.customerFirstName) {
                        return current;
                      }

                      const next = { ...current };
                      delete next.customerFirstName;
                      return next;
                    });
                    setSubmissionError(null);
                  }}
                  autoComplete="given-name"
                  aria-invalid={Boolean(clientFieldErrors.customerFirstName)}
                  aria-describedby={clientFieldErrors.customerFirstName ? 'customerFirstName-error' : undefined}
                  required
                />
                {clientFieldErrors.customerFirstName ? (
                  <p id="customerFirstName-error" className={styles.fieldError}>
                    {clientFieldErrors.customerFirstName}
                  </p>
                ) : null}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="customerLastName">
                  Priezvisko
                </label>
                <input
                  ref={lastNameInputRef}
                  id="customerLastName"
                  name="customerLastName"
                  className={`${styles.input} ${clientFieldErrors.customerLastName ? styles.inputError : ''}`}
                  value={customerLastName}
                  onChange={(event) => {
                    setCustomerLastName(event.target.value);
                    setClientFieldErrors((current) => {
                      if (!current.customerLastName) {
                        return current;
                      }

                      const next = { ...current };
                      delete next.customerLastName;
                      return next;
                    });
                    setSubmissionError(null);
                  }}
                  autoComplete="family-name"
                  aria-invalid={Boolean(clientFieldErrors.customerLastName)}
                  aria-describedby={clientFieldErrors.customerLastName ? 'customerLastName-error' : undefined}
                  required
                />
                {clientFieldErrors.customerLastName ? (
                  <p id="customerLastName-error" className={styles.fieldError}>
                    {clientFieldErrors.customerLastName}
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
                  className={`${styles.input} ${clientFieldErrors.customerPhone ? styles.inputError : ''}`}
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
                    setSubmissionError(null);
                  }}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder={PHONE_DISPLAY}
                  aria-invalid={Boolean(clientFieldErrors.customerPhone)}
                  aria-describedby={
                    clientFieldErrors.customerPhone ? 'customerPhone-hint customerPhone-error' : 'customerPhone-hint'
                  }
                  required
                />
                <p id="customerPhone-hint" className={styles.helperText}>
                  Telefónne číslo potrebujeme na potvrdenie termínu.
                </p>
                {clientFieldErrors.customerPhone ? (
                  <p id="customerPhone-error" className={styles.fieldError}>
                    {clientFieldErrors.customerPhone}
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
                  className={`${styles.input} ${clientFieldErrors.customerEmail ? styles.inputError : ''}`}
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
                    setSubmissionError(null);
                  }}
                  autoComplete="email"
                  placeholder="nepovinné"
                  aria-invalid={Boolean(clientFieldErrors.customerEmail)}
                  aria-describedby={clientFieldErrors.customerEmail ? 'customerEmail-error' : undefined}
                />
                {clientFieldErrors.customerEmail ? (
                  <p id="customerEmail-error" className={styles.fieldError}>
                    {clientFieldErrors.customerEmail}
                  </p>
                ) : null}
              </div>
            </div>

            <div className={styles.consentBox}>
              <label className={styles.checkboxRow} htmlFor="privacyConsent">
                <input
                  ref={privacyConsentRef}
                  id="privacyConsent"
                  name="privacyConsent"
                  type="checkbox"
                  value="accepted"
                  checked={privacyConsent}
                  onChange={(event) => {
                    setPrivacyConsent(event.target.checked);
                    setClientFieldErrors((current) => {
                      if (!current.privacyConsent) {
                        return current;
                      }

                      const next = { ...current };
                      delete next.privacyConsent;
                      return next;
                    });
                    setSubmissionError(null);
                  }}
                  aria-invalid={Boolean(clientFieldErrors.privacyConsent)}
                  aria-describedby={
                    clientFieldErrors.privacyConsent ? 'privacyConsent-hint privacyConsent-error' : 'privacyConsent-hint'
                  }
                  required
                />
                <span>
                  Súhlasím so spracovaním osobných údajov v rozsahu potrebnom na
                  vybavenie rezervácie a potvrdenie termínu.
                </span>
              </label>
              <p id="privacyConsent-hint" className={styles.helperText}>
                Použijeme ich len na kontakt k rezervácii a poskytnutie služby.
              </p>
              {clientFieldErrors.privacyConsent ? (
                <p id="privacyConsent-error" className={styles.fieldError}>
                  {clientFieldErrors.privacyConsent}
                </p>
              ) : null}
            </div>

            {submissionError ? (
              <div ref={formErrorRef} className={`${styles.alert} ${styles.alertError}`} tabIndex={-1} role="alert">
                {submissionError}
              </div>
            ) : null}

            <div className={styles.recapNote}>
              <strong>Na jednom mieste budete mať celý prehľad.</strong>
              <span>
                Ak sa ponáhľate, zavolajte nám priamo na <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>.
              </span>
            </div>

            <div className={styles.privacyNote}>
              Odoslaním formulára beriete na vedomie, že vaše údaje použijeme na
              spracovanie rezervácie, potvrdenie termínu a komunikáciu k službe.
              Vaše údaje nepredávame tretím stranám; technicky ich môžu
              spracúvať len nevyhnutní poskytovatelia prevádzky webu a
              rezervačného systému. Viac v{' '}
              <Link href="/ochrana-osobnych-udajov">ochrane osobných údajov</Link>.
            </div>

            <div className={styles.footerActions}>
              <button type="button" className="btn btn--ghost" onClick={goBack}>
                Späť
              </button>
              <SubmitButton />
            </div>
          </div>
        </div>
      </form>

      <aside className={`${styles.panel} ${styles.panelInner} ${styles.summaryPanel}`}>
        <p className="eyebrow">Súhrn</p>
        <SummaryRows items={summaryEntries} />
        <div className={styles.summaryHint}>Konečná cena podľa stavu srsti.</div>
        <div className={styles.summaryNote}>
          <strong>Otváracie hodiny</strong>
          <span>Po – Pia · 10:00 – 13:00 a 14:00 – 18:00</span>
        </div>
      </aside>
      </div>
    </>
  );
}
