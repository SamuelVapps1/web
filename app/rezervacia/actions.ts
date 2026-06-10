'use server';

import { revalidatePath } from 'next/cache';
import { createReservation, listReservationsBetween } from '@/lib/db';
import {
  getAvailableStartTimes,
  getDefaultDurationMinutes,
  type DogSize,
  type ReservationRecord,
} from '@/lib/reservations';
import { endOfBratislavaDayUtc, localDateTimeToUtc, startOfBratislavaDayUtc } from '@/lib/time';

export type ReservationSubmitState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; reservationId: string };

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

export async function submitReservation(
  _previousState: ReservationSubmitState,
  formData: FormData,
): Promise<ReservationSubmitState> {
  const selectedDate = normalizeInput(formData.get('selectedDate'));
  const selectedTime = normalizeInput(formData.get('selectedTime'));
  const clientName = normalizeInput(formData.get('clientName'));
  const clientPhone = normalizePhone(normalizeInput(formData.get('clientPhone')));
  const dogName = normalizeInput(formData.get('dogName'));
  const dogBreed = normalizeInput(formData.get('dogBreed'));
  const dogSize = getDogSize(normalizeInput(formData.get('dogSize')));
  const service = normalizeInput(formData.get('service'));
  const coatState = normalizeInput(formData.get('coatState'));
  const temperament = normalizeInput(formData.get('temperament'));
  const notes = normalizeInput(formData.get('notes'));
  const startsAtValue = normalizeInput(formData.get('startsAt'));
  const endsAtValue = normalizeInput(formData.get('endsAt'));
  const utmSource = normalizeInput(formData.get('utmSource')) || null;
  const utmMedium = normalizeInput(formData.get('utmMedium')) || null;
  const utmCampaign = normalizeInput(formData.get('utmCampaign')) || null;
  const discountCode = normalizeInput(formData.get('discountCode')) || null;

  if (!selectedDate || !selectedTime) {
    return { status: 'error', message: 'Vybraný termín už nie je dostupný.' };
  }

  if (!clientName || !clientPhone || !dogName || !dogBreed || !service || !coatState || !temperament) {
    return { status: 'error', message: 'Skontrolujte, či sú vyplnené všetky povinné polia.' };
  }

  if (!PHONE_PATTERN.test(clientPhone)) {
    return { status: 'error', message: 'Telefón nie je v správnom formáte.' };
  }

  const startsAt = startsAtValue ? new Date(startsAtValue) : localDateTimeToUtc(selectedDate, selectedTime);
  const duration = getDefaultDurationMinutes(dogSize);
  const endsAt = endsAtValue ? new Date(endsAtValue) : new Date(startsAt.getTime() + duration * 60 * 1000);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { status: 'error', message: 'Vybraný termín už nie je dostupný.' };
  }

  const dayStart = startOfBratislavaDayUtc(selectedDate);
  const dayEnd = endOfBratislavaDayUtc(selectedDate);
  const dayReservations: ReservationRecord[] = await listReservationsBetween(dayStart, dayEnd);
  const availableTimes = getAvailableStartTimes(selectedDate, dayReservations, dogSize);

  if (!availableTimes.includes(selectedTime)) {
    return { status: 'error', message: 'Vybraný termín už nie je dostupný.' };
  }

  try {
    const reservation = await createReservation({
      type: 'booking',
      status: 'pending',
      startsAt,
      endsAt,
      clientName,
      clientPhone,
      dogName,
      dogBreed,
      dogSize,
      service,
      coatState,
      temperament,
      notes: notes || null,
      utmSource,
      utmMedium,
      utmCampaign,
      discountCode,
    });

    revalidatePath('/rezervacia');
    revalidatePath('/diar');

    return { status: 'success', reservationId: reservation.id };
  } catch (error) {
    if (isPostgresConflict(error)) {
      return { status: 'error', message: 'Vybraný termín sa už medzitým obsadil.' };
    }

    return { status: 'error', message: 'Rezerváciu sa nepodarilo uložiť.' };
  }
}

