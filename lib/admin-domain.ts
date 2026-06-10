import { BOOKING_ADDONS, BOOKING_CUT_TYPES, BOOKING_SIZE_OPTIONS } from '@/lib/booking';
import { formatTimeKey, getBratislavaDateKey, isWeekendDateKey, localDateTimeToUtc, minutesToTimeKey, timeKeyToMinutes } from '@/lib/time';

export const ADMIN_TIME_WINDOW = {
  start: '10:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  end: '18:00',
} as const;

export const ADMIN_DURATION_OPTIONS = Array.from({ length: 8 }, (_, index) => (index + 1) * 30);

export type AdminReservationStatus = 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED';
export type AdminReservationTab = 'pending' | 'confirmed' | 'history';

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

export function getDogSizeLabel(value: string | null | undefined): string {
  return BOOKING_SIZE_OPTIONS.find((option) => option.value === value)?.label ?? 'Neznáma veľkosť';
}

export function getCutTypeLabel(value: string | null | undefined): string {
  return BOOKING_CUT_TYPES.find((item) => item.value === value)?.label ?? 'Neznámy typ strihu';
}

export function getAddonLabels(serviceIds: string[] | null | undefined): string {
  if (!serviceIds || serviceIds.length === 0) {
    return 'Bez doplnkov';
  }

  const labels = serviceIds
    .map((serviceId) => BOOKING_ADDONS.find((addon) => addon.code === serviceId)?.label ?? serviceId)
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
  const morningStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.start);
  const lunchStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchStart);
  const lunchEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchEnd);
  const dayEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.end);

  const inMorning = startMinutes >= morningStart && endMinutes <= lunchStart;
  const inAfternoon = startMinutes >= lunchEnd && endMinutes <= dayEnd;

  return inMorning || inAfternoon;
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
  const slots: string[] = [];
  const morningStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.start);
  const lunchStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchStart);
  const lunchEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchEnd);
  const dayEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.end);

  for (let startMinutes = morningStart; startMinutes < lunchStart; startMinutes += 30) {
    slots.push(minutesToTimeKey(startMinutes));
  }

  for (let startMinutes = lunchEnd; startMinutes < dayEnd; startMinutes += 30) {
    slots.push(minutesToTimeKey(startMinutes));
  }

  return slots;
}

export function buildDateTimeFromForm(date: string, time: string): Date {
  return localDateTimeToUtc(date, time);
}
