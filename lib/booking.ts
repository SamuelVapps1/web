import {
  addDaysToDateKey,
  formatBratislavaDate,
  getBratislavaDateKey,
  isWeekendDateKey,
  localDateTimeToUtc,
  minutesToTimeKey,
  timeKeyToMinutes,
  type LocalDateKey,
} from '@/lib/time';

export type DogSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type BookingServiceRecord = {
  id: string;
  name: string;
  basePrice: number;
  baseDurationMin: number;
};

export const BOOKING_PHONE_PATTERN = /^(?:\+421|0)\s?\d{3}\s?\d{3}\s?\d{3}$/;

export const BOOKING_OPENING_WINDOWS = [
  { start: '10:00', end: '13:00' },
  { start: '14:00', end: '18:00' },
] as const;

export const BOOKING_TIME_STEP_MINUTES = 30;

export const DOG_SIZE_OPTIONS: Array<{
  value: DogSize;
  label: string;
  note: string;
}> = [
  {
    value: 'SMALL',
    label: 'Malý',
    note: 'Pre drobné plemená a ľahšie úpravy.',
  },
  {
    value: 'MEDIUM',
    label: 'Stredný',
    note: 'Najčastejšia voľba pre stredné plemená.',
  },
  {
    value: 'LARGE',
    label: 'Veľký',
    note: 'Pre väčšie psy a dlhší čas úpravy.',
  },
] as const;

export function normalizeBookingText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeBookingPhone(phone: string): string {
  return phone.replace(/\s+/g, ' ').trim();
}

export function formatBookingCurrency(value: number): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getBookingMinDateKey(now: Date = new Date()): LocalDateKey {
  let candidate = addDaysToDateKey(getBratislavaDateKey(now), 1);

  while (isWeekendDateKey(candidate)) {
    candidate = addDaysToDateKey(candidate, 1);
  }

  return candidate;
}

export function isBookingDateAllowed(dateKey: string, now: Date = new Date()): boolean {
  const minDateKey = getBookingMinDateKey(now);
  return dateKey >= minDateKey && !isWeekendDateKey(dateKey);
}

export function getAllowedBookingTimes(
  dateKey: string,
  durationMinutes: number,
  now: Date = new Date(),
): string[] {
  if (!isBookingDateAllowed(dateKey, now) || durationMinutes <= 0) {
    return [];
  }

  const times: string[] = [];

  for (const window of BOOKING_OPENING_WINDOWS) {
    const windowStart = timeKeyToMinutes(window.start);
    const windowEnd = timeKeyToMinutes(window.end);

    for (
      let startMinutes = windowStart;
      startMinutes + durationMinutes <= windowEnd;
      startMinutes += BOOKING_TIME_STEP_MINUTES
    ) {
      times.push(minutesToTimeKey(startMinutes));
    }
  }

  return times;
}

export function buildBookingStart(dateKey: string, timeKey: string): Date {
  return localDateTimeToUtc(dateKey, timeKey);
}

export function formatBookingDate(dateKey: string): string {
  return formatBratislavaDate(localDateTimeToUtc(dateKey, '12:00'));
}

function normalizeServiceName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getGroomingSizeFromServiceName(serviceName: string): DogSize | null {
  const normalized = normalizeServiceName(serviceName);

  if (normalized === 'strihanie maly') {
    return 'SMALL';
  }

  if (normalized === 'strihanie stredny') {
    return 'MEDIUM';
  }

  if (normalized === 'strihanie velky') {
    return 'LARGE';
  }

  return null;
}

export function findMatchingGroomingServiceId(
  services: BookingServiceRecord[],
  size: DogSize,
): string | null {
  return (
    services.find((service) => getGroomingSizeFromServiceName(service.name) === size)?.id ?? null
  );
}
