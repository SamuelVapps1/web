import { getDogSizeLabel, getReservationStatusLabel } from '@/lib/admin-labels.js';
import {
  formatTimeKey,
  getBratislavaDateKey,
  isWeekendDateKey,
  localDateTimeToUtc,
  timeKeyToMinutes,
} from '@/lib/time';
import { OPENING_HOURS, buildWorkingDaySlots as buildOpeningWorkingDaySlots } from '@/lib/opening-hours.js';

export const ADMIN_TIME_WINDOW = {
  start: OPENING_HOURS.dayStart,
  lunchStart: OPENING_HOURS.lunchBreak.start,
  lunchEnd: OPENING_HOURS.lunchBreak.end,
  end: OPENING_HOURS.dayEnd,
} as const;

export const ADMIN_DURATION_OPTIONS = Array.from({ length: 8 }, (_, index) => (index + 1) * 30);

export type AdminReservationStatus = 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED';
export type AdminReservationTab = 'pending' | 'confirmed' | 'history';
export type AdminCalendarView = 'week' | 'month';

export const ADMIN_CUSTOMER_TAGS = [
  { value: 'vip', label: '⭐ VIP' },
  { value: 'new', label: '✨ Nový' },
  { value: 'regular', label: '🔁 Pravidelný' },
  { value: 'senior', label: '🎂 Senior' },
  { value: 'sensitive', label: '🤶 Citlivý' },
  { value: 'anxious', label: '🌪️ Nervózny' },
] as const;

export type ReservationCollisionDTO = {
  id: string;
  customerName: string;
  dogName: string;
  phone: string;
  start: string;
  end: string;
  status: AdminReservationStatus;
};

export type ScheduleCandidate = {
  start: Date;
  end: Date;
  id?: string;
};

export type ScheduleReservation = ScheduleCandidate & {
  status: AdminReservationStatus;
  customerName: string;
  dogName: string;
  phone: string;
};

export function getCustomerTagLabel(value: string | null | undefined): string {
  return ADMIN_CUSTOMER_TAGS.find((tag) => tag.value === value)?.label ?? value ?? '';
}

export function getCustomerTagLabels(tags: string[] | null | undefined): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  return tags.map((tag) => getCustomerTagLabel(tag)).filter(Boolean);
}

export function getCustomerTagSummary(tags: string[] | null | undefined): string {
  const labels = getCustomerTagLabels(tags);
  return labels.length > 0 ? labels.join(' · ') : 'Bez tagov';
}

export function getCutTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Neznámy typ strihu';
  }

  switch (value) {
    case 'SHORT':
      return 'Krátky strih';
    case 'STANDARD':
      return 'Plný / štandardný strih';
    case 'NO_CUT':
      return 'Úprava bez strihania';
    case 'ADVICE':
      return 'Neviem - poraďte mi';
    default:
      return 'Neznámy typ strihu';
  }
}

export { getDogSizeLabel };
export { getReservationStatusLabel };

export function getAddonLabels(serviceIds: string[] | null | undefined): string {
  if (!serviceIds || serviceIds.length === 0) {
    return 'Bez doplnkov';
  }

  const labels = serviceIds
    .map((serviceId) => {
      switch (serviceId) {
        case 'BATH':
          return 'Kúpanie';
        case 'NAILS':
          return 'Pazúriky';
        case 'EARS':
          return 'Čistenie uší';
        default:
          return serviceId;
      }
    })
    .filter(Boolean);

  return labels.length > 0 ? labels.join(', ') : 'Bez doplnkov';
}

export function getDefaultDurationForSize(size: string | null | undefined): number {
  if (size === 'SMALL') {
    return 60;
  }

  if (size === 'LARGE') {
    return 120;
  }

  return 90;
}

export function formatPhoneLink(phone: string | null | undefined): string {
  return phone?.trim() ?? '';
}

export function getEffectiveReservationStart(
  requestedStart: Date,
  confirmedStart: Date | null | undefined,
): Date {
  return confirmedStart ?? requestedStart;
}

export function getEffectiveReservationEnd(
  requestedStart: Date,
  confirmedStart: Date | null | undefined,
  durationMin: number,
): Date {
  const start = getEffectiveReservationStart(requestedStart, confirmedStart);
  return new Date(start.getTime() + durationMin * 60 * 1000);
}

export function formatReservationClockRange(start: Date, end: Date): string {
  return `${formatTimeKey(start)} – ${formatTimeKey(end)}`;
}

export function buildReservationCollisionDTO(reservation: ScheduleReservation): ReservationCollisionDTO {
  return {
    id: reservation.id ?? '',
    customerName: reservation.customerName,
    dogName: reservation.dogName,
    phone: reservation.phone,
    start: formatTimeKey(reservation.start),
    end: formatTimeKey(reservation.end),
    status: reservation.status,
  };
}

function isWithinWorkingWindow(startMinutes: number, endMinutes: number): boolean {
  return OPENING_HOURS.blocks.some((window) => {
    const windowStart = timeKeyToMinutes(window.start);
    const windowEnd = timeKeyToMinutes(window.end);
    return startMinutes >= windowStart && endMinutes <= windowEnd;
  });
}

export function fitsSalonHours(start: Date, end: Date): boolean {
  if (end <= start) {
    return false;
  }

  const startDateKey = getBratislavaDateKey(start);
  if (startDateKey !== getBratislavaDateKey(end)) {
    return false;
  }

  if (isWeekendDateKey(startDateKey)) {
    return false;
  }

  const startMinutes = timeKeyToMinutes(formatTimeKey(start));
  const endMinutes = timeKeyToMinutes(formatTimeKey(end));

  return isWithinWorkingWindow(startMinutes, endMinutes);
}

export function hasReservationCollision(candidate: ScheduleCandidate, reservations: ScheduleCandidate[]): boolean {
  return reservations.some((reservation) => reservation.start < candidate.end && reservation.end > candidate.start);
}

export function findReservationCollisions(
  candidate: ScheduleCandidate,
  reservations: ScheduleReservation[],
): ReservationCollisionDTO[] {
  return reservations
    .filter((reservation) => reservation.status === 'CONFIRMED')
    .filter((reservation) => reservation.start < candidate.end && reservation.end > candidate.start)
    .map(buildReservationCollisionDTO);
}

export function buildWorkingDaySlots(): string[] {
  return buildOpeningWorkingDaySlots();
}

export function buildDateTimeFromForm(date: string, time: string): Date {
  return localDateTimeToUtc(date, time);
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = new Date(localDateTimeToUtc(dateKey, '12:00'));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return getBratislavaDateKey(date);
}

export function shiftMonthKey(dateKey: string, deltaMonths: number): string {
  const date = new Date(localDateTimeToUtc(dateKey, '12:00'));
  date.setUTCMonth(date.getUTCMonth() + deltaMonths);
  return getBratislavaDateKey(date);
}

export function getMonthLabel(dateKey: string): string {
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    month: 'long',
    year: 'numeric',
  }).format(localDateTimeToUtc(dateKey, '12:00'));
}

export function getWeekRangeLabel(startKey: string, endKey: string): string {
  const formatter = new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    day: 'numeric',
    month: 'long',
  });

  return `${formatter.format(localDateTimeToUtc(startKey, '12:00'))} – ${formatter.format(localDateTimeToUtc(endKey, '12:00'))}`;
}
