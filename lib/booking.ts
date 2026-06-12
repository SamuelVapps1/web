import {
  addDaysToDateKey,
  formatBratislavaDate,
  getBratislavaDateKey,
  isWeekendDateKey,
  localDateTimeToUtc,
  timeKeyToMinutes,
  type LocalDateKey,
} from '@/lib/time';
import { OPENING_HOURS, buildWorkingDaySlots } from '@/lib/opening-hours.js';

export type DogSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type CutType = 'SHORT' | 'STANDARD' | 'NO_CUT' | 'ADVICE';
export type BookingAddonCode = 'BATH' | 'NAILS' | 'EARS';

export interface BookingAddonRecord {
  code: BookingAddonCode;
  label: string;
  price: number;
  durationMin: number;
  note: string;
}

export interface BookingCutTypeRecord {
  value: CutType;
  label: string;
  note: string;
}

export interface BookingBusyInterval {
  date: LocalDateKey;
  start: `${number}:${number}`;
  end: `${number}:${number}`;
}

export const BOOKING_PHONE_PATTERN =
  /^(?:\+?421[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}|0\d{3}[\s-]?\d{3}[\s-]?\d{3})$/;

export const BOOKING_SIZE_BASE_PRICES: Record<DogSize, number> = {
  SMALL: 40,
  MEDIUM: 50,
  LARGE: 60,
};

export const BOOKING_SIZE_OPTIONS = [
  { value: 'SMALL', label: 'Malý', note: 'Vhodné pre menšie plemená.' },
  { value: 'MEDIUM', label: 'Stredný', note: 'Pre psy strednej veľkosti.' },
  { value: 'LARGE', label: 'Veľký', note: 'Pre väčšie plemená.' },
] as const satisfies readonly {
  value: DogSize;
  label: string;
  note: string;
}[];

export const BOOKING_CUT_TYPES = [
  { value: 'SHORT', label: 'Krátky strih', note: 'Praktické skrátenie srsti.' },
  { value: 'STANDARD', label: 'Plný / štandardný strih', note: 'Klasická úprava podľa stavu srsti.' },
  { value: 'NO_CUT', label: 'Úprava bez strihania', note: 'Len kúpanie a vyčesanie.' },
  { value: 'ADVICE', label: 'Neviem — poradíte mi', note: 'Spoločne vyberieme vhodný postup.' },
] as const satisfies readonly BookingCutTypeRecord[];

export const BOOKING_ADDONS = [
  { code: 'BATH', label: 'Kúpanie', price: 15, durationMin: 30, note: 'Starostlivosť podľa stavu srsti.' },
  { code: 'NAILS', label: 'Pazúriky', price: 5, durationMin: 10, note: 'Rýchla úprava pazúrikov.' },
  { code: 'EARS', label: 'Čistenie uší', price: 5, durationMin: 10, note: 'Šetrné čistenie podľa potreby.' },
] as const satisfies readonly BookingAddonRecord[];

const BOOKING_SLOT_STEP_MINUTES = 30;
const BOOKING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const BOOKING_ADDON_MAP = new Map<BookingAddonCode, BookingAddonRecord>(
  BOOKING_ADDONS.map((addon) => [addon.code, addon] as const),
);
const BOOKING_CUT_TYPE_MAP = new Map(
  BOOKING_CUT_TYPES.map((cutType) => [cutType.value, cutType] as const),
);

function isValidDateKey(dateKey: string): boolean {
  return BOOKING_DATE_PATTERN.test(dateKey);
}

function toNoonUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid booking date key: ${dateKey}`);
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function toPositiveInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function normalizeBookingText(value: FormDataEntryValue | string | number | null | undefined): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

export function normalizeBookingPhone(value: FormDataEntryValue | string | null | undefined): string {
  const raw = normalizeBookingText(value);
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('421')) {
    return `+421 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+421 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  }

  return '';
}

export function formatBookingCurrency(value: number): string {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getBookingMinDateKey(now: Date = new Date()): LocalDateKey {
  let nextDateKey = addDaysToDateKey(getBratislavaDateKey(now), 1);

  while (isWeekendDateKey(nextDateKey)) {
    nextDateKey = addDaysToDateKey(nextDateKey, 1);
  }

  return nextDateKey;
}

export function isBookingDateAllowed(dateKey: string, now: Date = new Date()): boolean {
  if (!isValidDateKey(dateKey)) {
    return false;
  }

  return dateKey >= getBookingMinDateKey(now) && !isWeekendDateKey(dateKey);
}

export function getBookingMonthLabel(dateKey: string): string {
  if (!isValidDateKey(dateKey)) {
    return '';
  }

  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    month: 'long',
    year: 'numeric',
  }).format(toNoonUtc(dateKey));
}

export function formatBookingMonthLabel(dateKey: string): string {
  return getBookingMonthLabel(dateKey);
}

export function formatBookingDate(dateKey: string): string {
  if (!isValidDateKey(dateKey)) {
    return '';
  }

  return formatBratislavaDate(toNoonUtc(dateKey));
}

export function getBasePriceForSize(size: DogSize): number {
  return BOOKING_SIZE_BASE_PRICES[size];
}

export function getAddonPriceTotal(codes: readonly string[]): number {
  return codes.reduce((total, code) => total + (BOOKING_ADDON_MAP.get(code as BookingAddonCode)?.price ?? 0), 0);
}

export function getSelectedAddonRecords(codes: readonly string[]): BookingAddonRecord[] {
  return BOOKING_ADDONS.filter((addon) => codes.includes(addon.code)) as BookingAddonRecord[];
}

export function getCutTypeRecord(value: string | null | undefined): BookingCutTypeRecord | null {
  if (!value) {
    return null;
  }

  return BOOKING_CUT_TYPE_MAP.get(value as CutType) ?? null;
}

export function getOpenBookingSlots(dateKey: string): string[] {
  if (!isBookingDateAllowed(dateKey)) {
    return [];
  }

  return buildWorkingDaySlots().filter((timeKey) => {
    return OPENING_HOURS.blocks.some((window) => {
      const windowStart = timeKeyToMinutes(window.start);
      const windowEnd = timeKeyToMinutes(window.end);
      const slotMinutes = timeKeyToMinutes(timeKey);

      return slotMinutes >= windowStart && slotMinutes + BOOKING_SLOT_STEP_MINUTES <= windowEnd;
    });
  });
}

export function isBookingSlotBusy(
  dateKey: string,
  timeKey: string,
  busyIntervals: readonly BookingBusyInterval[],
): boolean {
  if (!isValidDateKey(dateKey)) {
    return false;
  }

  const slotStart = localDateTimeToUtc(dateKey, timeKey);
  const slotEnd = new Date(slotStart.getTime() + BOOKING_SLOT_STEP_MINUTES * 60 * 1000);

  return busyIntervals.some((interval) => {
    if (interval.date !== dateKey) {
      return false;
    }

    const busyStart = localDateTimeToUtc(interval.date, interval.start);
    const busyEnd = localDateTimeToUtc(interval.date, interval.end);

    return busyStart < slotEnd && busyEnd > slotStart;
  });
}

export function getFreeBookingSlots(
  dateKey: string,
  busyIntervals: readonly BookingBusyInterval[],
): string[] {
  return getOpenBookingSlots(dateKey).filter((timeKey) => !isBookingSlotBusy(dateKey, timeKey, busyIntervals));
}

export function isBookingDayBusy(
  dateKey: string,
  busyIntervals: readonly BookingBusyInterval[],
): boolean {
  const openSlots = getOpenBookingSlots(dateKey);

  if (openSlots.length === 0) {
    return false;
  }

  return getFreeBookingSlots(dateKey, busyIntervals).length === 0;
}

export function estimateReservationDurationMin(
  size: DogSize,
  cutType: CutType,
  addonCodes: readonly string[],
): number {
  const baseDurationBySize: Record<DogSize, number> = {
    SMALL: 60,
    MEDIUM: 90,
    LARGE: 120,
  };

  const cutTypeDelta: Record<CutType, number> = {
    SHORT: -15,
    STANDARD: 0,
    NO_CUT: -20,
    ADVICE: 0,
  };

  const addonDuration = addonCodes.reduce(
    (total, code) => total + (BOOKING_ADDON_MAP.get(code as BookingAddonCode)?.durationMin ?? 0),
    0,
  );

  return Math.max(30, toPositiveInteger(baseDurationBySize[size] + cutTypeDelta[cutType] + addonDuration));
}

export function estimateReservationPrice(size: DogSize, addonCodes: readonly string[]): number {
  return getBasePriceForSize(size) + getAddonPriceTotal(addonCodes);
}
