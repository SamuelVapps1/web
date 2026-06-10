import {
  addDaysToDateKey,
  endOfBratislavaDayUtc,
  formatBratislavaDate,
  formatBratislavaDateTime,
  formatTimeKey,
  formatDateKey,
  getBratislavaDateKey,
  isDateKeyBeforeToday,
  isDateKeyToday,
  getBratislavaWeekdayIndex,
  isWeekendDateKey,
  localDateTimeToUtc,
  minutesToTimeKey,
  startOfBratislavaDayUtc,
  timeKeyToMinutes,
  TIME_ZONE,
} from '@/lib/time';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ReservationType = 'booking' | 'block';
export type DogSize = 'small' | 'medium' | 'large';

export const DEFAULT_DURATIONS: Record<DogSize, number> = {
  small: 60,
  medium: 90,
  large: 120,
};

export const OPENING_WINDOWS = [
  { start: '10:00', end: '13:00' },
  { start: '14:00', end: '18:00' },
] as const;

type TimeWindow = (typeof OPENING_WINDOWS)[number];

export interface ReservationRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: ReservationType;
  status: ReservationStatus;
  startsAt: Date;
  endsAt: Date;
  clientName: string | null;
  clientPhone: string | null;
  dogName: string | null;
  dogBreed: string | null;
  dogSize: DogSize | null;
  service: string | null;
  coatState: string | null;
  temperament: string | null;
  notes: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  discountCode: string | null;
}

export interface SerializedReservationRecord extends Omit<ReservationRecord, 'createdAt' | 'updatedAt' | 'startsAt' | 'endsAt'> {
  createdAt: string;
  updatedAt: string;
  startsAt: string;
  endsAt: string;
}

export interface ReservationAvailability {
  isClosed: boolean;
  isNoSlots: boolean;
  availableTimes: string[];
}

export interface ReservationWindow {
  startsAt: Date;
  endsAt: Date;
}

export interface NewReservationInput {
  type: ReservationType;
  status: ReservationStatus;
  startsAt: Date;
  endsAt: Date;
  clientName?: string | null;
  clientPhone?: string | null;
  dogName?: string | null;
  dogBreed?: string | null;
  dogSize?: DogSize | null;
  service?: string | null;
  coatState?: string | null;
  temperament?: string | null;
  notes?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  discountCode?: string | null;
}

export function normalizeReservationRecord(row: Record<string, unknown>): ReservationRecord {
  return {
    id: String(row.id),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
    type: row.type as ReservationType,
    status: row.status as ReservationStatus,
    startsAt: new Date(String(row.starts_at)),
    endsAt: new Date(String(row.ends_at)),
    clientName: row.client_name == null ? null : String(row.client_name),
    clientPhone: row.client_phone == null ? null : String(row.client_phone),
    dogName: row.dog_name == null ? null : String(row.dog_name),
    dogBreed: row.dog_breed == null ? null : String(row.dog_breed),
    dogSize: row.dog_size == null ? null : (row.dog_size as DogSize),
    service: row.service == null ? null : String(row.service),
    coatState: row.coat_state == null ? null : String(row.coat_state),
    temperament: row.temperament == null ? null : String(row.temperament),
    notes: row.notes == null ? null : String(row.notes),
    utmSource: row.utm_source == null ? null : String(row.utm_source),
    utmMedium: row.utm_medium == null ? null : String(row.utm_medium),
    utmCampaign: row.utm_campaign == null ? null : String(row.utm_campaign),
    discountCode: row.discount_code == null ? null : String(row.discount_code),
  };
}

export function serializeReservationRecord(record: ReservationRecord): SerializedReservationRecord {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    startsAt: record.startsAt.toISOString(),
    endsAt: record.endsAt.toISOString(),
  };
}

export function deserializeReservationRecord(record: SerializedReservationRecord): ReservationRecord {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    startsAt: new Date(record.startsAt),
    endsAt: new Date(record.endsAt),
  };
}

export function getDefaultDurationMinutes(dogSize: DogSize | null | undefined): number {
  if (dogSize === 'small') {
    return DEFAULT_DURATIONS.small;
  }
  if (dogSize === 'large') {
    return DEFAULT_DURATIONS.large;
  }
  return DEFAULT_DURATIONS.medium;
}

function blocksAvailability(reservation: ReservationRecord): boolean {
  return reservation.status !== 'cancelled';
}

function overlaps(candidate: ReservationWindow, reservation: ReservationRecord): boolean {
  return reservation.startsAt < candidate.endsAt && reservation.endsAt > candidate.startsAt;
}

function windowContainsMinutes(startMinutes: number, endMinutes: number, window: TimeWindow): boolean {
  const windowStart = timeKeyToMinutes(window.start);
  const windowEnd = timeKeyToMinutes(window.end);
  return startMinutes >= windowStart && endMinutes <= windowEnd;
}

export function fitsOpeningHours(startsAt: Date, endsAt: Date): boolean {
  if (endsAt <= startsAt) {
    return false;
  }

  const dateKey = getBratislavaDateKey(startsAt);
  if (dateKey !== getBratislavaDateKey(endsAt)) {
    return false;
  }

  if (isWeekendDateKey(dateKey)) {
    return false;
  }

  const startMinutes = timeKeyToMinutes(formatTimeKey(startsAt));
  const endMinutes = timeKeyToMinutes(formatTimeKey(endsAt));

  return OPENING_WINDOWS.some((window) => windowContainsMinutes(startMinutes, endMinutes, window));
}

export function getDayWindowRange(dateKey: string): ReservationWindow {
  return {
    startsAt: startOfBratislavaDayUtc(dateKey),
    endsAt: endOfBratislavaDayUtc(dateKey),
  };
}

export function getAvailableStartTimes(
  dateKey: string,
  reservations: ReservationRecord[],
  dogSize: DogSize | null | undefined,
  now: Date = new Date(),
): string[] {
  if (isDateKeyBeforeToday(dateKey, getBratislavaDateKey(now))) {
    return [];
  }

  if (isWeekendDateKey(dateKey)) {
    return [];
  }

  const duration = getDefaultDurationMinutes(dogSize);
  const available: string[] = [];

  for (const window of OPENING_WINDOWS) {
    const windowStart = timeKeyToMinutes(window.start);
    const windowEnd = timeKeyToMinutes(window.end);

    for (let startMinutes = windowStart; startMinutes + duration <= windowEnd; startMinutes += 30) {
      const timeKey = minutesToTimeKey(startMinutes);
      const startsAt = localDateTimeToUtc(dateKey, timeKey);
      const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);
      const candidate = { startsAt, endsAt };

      if (isDateKeyToday(dateKey, getBratislavaDateKey(now)) && startsAt.getTime() <= now.getTime()) {
        continue;
      }

      if (!windowContainsMinutes(startMinutes, startMinutes + duration, window)) {
        continue;
      }

      const conflict = reservations.some((reservation) => blocksAvailability(reservation) && overlaps(candidate, reservation));
      if (!conflict) {
        available.push(timeKey);
      }
    }
  }

  return available;
}

export function getDayAvailability(
  dateKey: string,
  reservations: ReservationRecord[],
  dogSize: DogSize | null | undefined,
  now: Date = new Date(),
): ReservationAvailability {
  const availableTimes = getAvailableStartTimes(dateKey, reservations, dogSize, now);

  return {
    isClosed: isWeekendDateKey(dateKey),
    isNoSlots: !isWeekendDateKey(dateKey) && availableTimes.length === 0,
    availableTimes,
  };
}

export function formatReservationRange(reservation: ReservationRecord): string {
  const dateLabel = formatBratislavaDate(reservation.startsAt);
  const startLabel = new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(reservation.startsAt);
  const endLabel = new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(reservation.endsAt);

  return `${dateLabel} · ${startLabel} – ${endLabel}`;
}

export function formatReservationDateTime(reservation: ReservationRecord): string {
  return `${formatBratislavaDateTime(reservation.startsAt)} – ${new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(reservation.endsAt)}`;
}

export function getMondayDateKey(dateKey: string): string {
  const weekdayIndex = getBratislavaWeekdayIndex(localDateTimeToUtc(dateKey, '12:00'));
  const delta = weekdayIndex === 0 ? -6 : 1 - weekdayIndex;
  return addDaysToDateKey(dateKey, delta);
}

export function getWeekDateKeys(anchorDateKey: string): string[] {
  const monday = getMondayDateKey(anchorDateKey);
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(monday, index));
}

export function getWeekRangeLabel(anchorDateKey: string): string {
  const dates = getWeekDateKeys(anchorDateKey);
  return `${formatBratislavaDate(localDateTimeToUtc(dates[0], '12:00'))} – ${formatBratislavaDate(localDateTimeToUtc(dates[6], '12:00'))}`;
}

export function groupReservationsByDate(reservations: ReservationRecord[]): Map<string, ReservationRecord[]> {
  const groups = new Map<string, ReservationRecord[]>();

  for (const reservation of reservations) {
    const key = formatDateKey(reservation.startsAt);
    const current = groups.get(key) ?? [];
    current.push(reservation);
    groups.set(key, current);
  }

  for (const value of groups.values()) {
    value.sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  }

  return groups;
}

export function hasBlockingReservationOnDate(dateKey: string, reservations: ReservationRecord[]): boolean {
  const range = getDayWindowRange(dateKey);
  return reservations.some((reservation) => blocksAvailability(reservation) && overlaps(range, reservation));
}
