export type AdminReservationStatus = 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED';

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

export type NextFreeWorkingSlot = {
  dateKey: string;
  timeKey: string;
  start: Date;
  end: Date;
};

export type NextFreeWorkingSlotsParams = {
  startAt: Date;
  durationMin: number;
  reservations: ScheduleReservation[];
  limit?: number;
};

export declare const ADMIN_TIME_WINDOW: {
  readonly start: '10:00';
  readonly lunchStart: '13:00';
  readonly lunchEnd: '14:00';
  readonly end: '18:00';
};

export declare function buildDateTimeFromForm(date: string, time: string): Date;
export declare function fitsSalonHours(start: Date, end: Date): boolean;
export declare function buildWorkingDaySlots(): string[];
export declare function hasReservationCollision(candidate: ScheduleCandidate, reservations: ScheduleCandidate[]): boolean;
export declare function findReservationCollisions(candidate: ScheduleCandidate, reservations: ScheduleReservation[]): ReservationCollisionDTO[];
export declare function findNextFreeWorkingSlots(params: NextFreeWorkingSlotsParams): NextFreeWorkingSlot[];
