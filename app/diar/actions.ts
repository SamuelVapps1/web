'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createReservation,
  getReservationById,
  listReservationsBetween,
  updateReservationEndsAt,
  updateReservationStatus,
} from '@/lib/db';
import {
  fitsOpeningHours,
  getDefaultDurationMinutes,
  type DogSize,
  type ReservationRecord,
} from '@/lib/reservations';
import { endOfBratislavaDayUtc, getBratislavaDateKey, localDateTimeToUtc, startOfBratislavaDayUtc } from '@/lib/time';

const PHONE_PATTERN = /^(?:\+421|0)\s?\d{3}\s?\d{3}\s?\d{3}$/;

function normalizeInput(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, ' ').trim();
}

function getDogSize(value: string): DogSize {
  if (value === 'small' || value === 'large') {
    return value;
  }
  return 'medium';
}

function isPostgresConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23P01';
}

function getDiaryUrl(formData: FormData, error: string | null = null): string {
  const view = normalizeInput(formData.get('view')) || 'week';
  const date = normalizeInput(formData.get('date')) || getBratislavaDateKey();
  const params = new URLSearchParams({ view, date });
  if (error) {
    params.set('error', error);
  }
  return `/diar?${params.toString()}`;
}

function redirectBack(formData: FormData, error: string | null = null): never {
  redirect(getDiaryUrl(formData, error));
}

function parseLocalDateTimeInput(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) {
    return null;
  }

  return localDateTimeToUtc(datePart, timePart);
}

function hasOverlap(reservations: ReservationRecord[], startsAt: Date, endsAt: Date, excludeId?: string): boolean {
  return reservations.some((reservation) => {
    if (excludeId && reservation.id === excludeId) {
      return false;
    }

    if (reservation.status === 'cancelled') {
      return false;
    }

    return reservation.startsAt < endsAt && reservation.endsAt > startsAt;
  });
}

async function loadDayReservations(startsAt: Date): Promise<ReservationRecord[]> {
  const dateKey = getBratislavaDateKey(startsAt);
  return listReservationsBetween(startOfBratislavaDayUtc(dateKey), endOfBratislavaDayUtc(dateKey));
}

export async function updateReservationStatusAction(formData: FormData): Promise<void> {
  const id = normalizeInput(formData.get('id'));
  const status = normalizeInput(formData.get('status'));

  if (!id || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    redirectBack(formData, 'invalid');
  }

  const updated = await updateReservationStatus(id, status as 'pending' | 'confirmed' | 'cancelled' | 'completed');
  if (!updated) {
    redirectBack(formData, 'missing');
  }

  revalidatePath('/diar');
  revalidatePath('/rezervacia');
  redirectBack(formData);
}

export async function updateReservationEndsAtAction(formData: FormData): Promise<void> {
  const id = normalizeInput(formData.get('id'));
  const newEndsAtLocal = normalizeInput(formData.get('endsAtLocal'));

  if (!id || !newEndsAtLocal) {
    redirectBack(formData, 'invalid');
  }

  const reservation = await getReservationById(id);
  if (!reservation) {
    redirectBack(formData, 'missing');
  }

  const newEndsAt = parseLocalDateTimeInput(newEndsAtLocal);
  if (!newEndsAt || !fitsOpeningHours(reservation.startsAt, newEndsAt)) {
    redirectBack(formData, 'invalid');
  }

  const dayReservations = await loadDayReservations(reservation.startsAt);
  if (hasOverlap(dayReservations, reservation.startsAt, newEndsAt, reservation.id)) {
    redirectBack(formData, 'slot');
  }

  try {
    const updated = await updateReservationEndsAt(id, newEndsAt);
    if (!updated) {
      redirectBack(formData, 'missing');
    }

    revalidatePath('/diar');
    revalidatePath('/rezervacia');
    redirectBack(formData);
  } catch (error) {
    if (isPostgresConflict(error)) {
      redirectBack(formData, 'slot');
    }

    redirectBack(formData, 'error');
  }
}

async function createDiaryReservationRecord(formData: FormData, type: 'booking' | 'block'): Promise<void> {
  const startsAtLocal = normalizeInput(formData.get('startsAtLocal'));
  const endsAtLocal = normalizeInput(formData.get('endsAtLocal'));
  const startsAt = parseLocalDateTimeInput(startsAtLocal);
  const clientName = normalizeInput(formData.get('clientName'));
  const clientPhone = normalizePhone(normalizeInput(formData.get('clientPhone')));
  const dogName = normalizeInput(formData.get('dogName'));
  const dogBreed = normalizeInput(formData.get('dogBreed'));
  const dogSize = getDogSize(normalizeInput(formData.get('dogSize')));
  const service = normalizeInput(formData.get('service'));
  const coatState = normalizeInput(formData.get('coatState'));
  const temperament = normalizeInput(formData.get('temperament'));
  const notes = normalizeInput(formData.get('notes'));
  const duration = getDefaultDurationMinutes(dogSize);
  const endsAt = type === 'block' ? parseLocalDateTimeInput(endsAtLocal) : startsAt ? new Date(startsAt.getTime() + duration * 60 * 1000) : null;

  if (!startsAt || !endsAt || !fitsOpeningHours(startsAt, endsAt)) {
    redirectBack(formData, 'invalid');
  }

  const dayReservations = await loadDayReservations(startsAt);
  if (hasOverlap(dayReservations, startsAt, endsAt)) {
    redirectBack(formData, 'slot');
  }

  if (type === 'booking') {
    if (!clientName || !clientPhone || !dogName || !dogBreed || !service || !coatState || !temperament) {
      redirectBack(formData, 'invalid');
    }

    if (!PHONE_PATTERN.test(clientPhone)) {
      redirectBack(formData, 'invalid');
    }
  }

  try {
    await createReservation({
      type,
      status: 'confirmed',
      startsAt,
      endsAt,
      clientName: type === 'booking' ? clientName : null,
      clientPhone: type === 'booking' ? clientPhone : null,
      dogName: type === 'booking' ? dogName : null,
      dogBreed: type === 'booking' ? dogBreed : null,
      dogSize: type === 'booking' ? dogSize : null,
      service: type === 'booking' ? service : null,
      coatState: type === 'booking' ? coatState : null,
      temperament: type === 'booking' ? temperament : null,
      notes: notes || null,
    });

    revalidatePath('/diar');
    revalidatePath('/rezervacia');
    redirectBack(formData);
  } catch (error) {
    if (isPostgresConflict(error)) {
      redirectBack(formData, 'slot');
    }

    redirectBack(formData, 'error');
  }
}

export async function createDiaryBookingAction(formData: FormData): Promise<void> {
  await createDiaryReservationRecord(formData, 'booking');
}

export async function createDiaryBlockAction(formData: FormData): Promise<void> {
  await createDiaryReservationRecord(formData, 'block');
}
