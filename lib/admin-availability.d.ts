export type RawAvailabilityReservation = {
  id: string;
  status: string;
  requestedStart: string;
  confirmedStart: string | null;
  durationMin: number;
  customerName: string;
  dogName: string;
  customerPhone: string;
};

export type AvailabilityScheduleReservation = {
  id: string;
  status: string;
  customerName: string;
  dogName: string;
  phone: string;
  start: Date;
  end: Date;
};

export type AvailabilityCollision = {
  id: string;
  customerName: string;
  dogName: string;
  phone: string;
  start: string;
  end: string;
  status: string;
};

export type DailySlotAvailability = {
  timeKey: string;
  collisions: AvailabilityCollision[];
  busy: boolean;
};

export function mapConfirmedAvailabilityReservations(
  reservations: RawAvailabilityReservation[],
): AvailabilityScheduleReservation[];

export function getAvailabilityCandidate(
  dateKey: string,
  timeKey: string,
  durationMin: number,
): { start: Date; end: Date };

export function getDailySlotAvailability(params: {
  dateKey: string;
  durationMin: number;
  reservations: AvailabilityScheduleReservation[];
}): DailySlotAvailability[];

export function getLiveAvailability(params: {
  dateKey: string;
  timeKey: string;
  durationMin: number;
  reservations: AvailabilityScheduleReservation[];
}): {
  candidate: { start: Date; end: Date };
  collisions: AvailabilityCollision[];
  isFree: boolean;
};

export function getNextAvailableSlots(params: {
  startAt: Date;
  durationMin: number;
  reservations: AvailabilityScheduleReservation[];
  limit?: number;
}): {
  dateKey: string;
  timeKey: string;
  start: Date;
  end: Date;
}[];

export function formatAvailabilitySlotLabel(date: Date, timeKey: string): string;
