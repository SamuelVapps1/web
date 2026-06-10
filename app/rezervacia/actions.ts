'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { localDateTimeToUtc } from '@/lib/time';
import { getPrisma } from '@/lib/prisma';
import {
  BOOKING_ADDONS,
  BOOKING_CUT_TYPES,
  BOOKING_PHONE_PATTERN,
  BOOKING_SIZE_OPTIONS,
  estimateReservationDurationMin,
  getOpenBookingSlots,
  isBookingDateAllowed,
  normalizeBookingPhone,
  normalizeBookingText,
  type BookingAddonCode,
  type CutType,
  type DogSize,
} from '@/lib/booking';

export type BookingSubmitState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success' };

type RateLimitBucket = {
  timestamps: number[];
};

const rateLimitStore = new Map<string, RateLimitBucket>();

const REQUEST_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
} as const;

const PHONE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 2,
} as const;

function takeRateLimitSlot(
  key: string,
  config: { windowMs: number; maxRequests: number },
  now = Date.now(),
): boolean {
  const current = rateLimitStore.get(key)?.timestamps ?? [];
  const recent = current.filter((timestamp) => now - timestamp < config.windowMs);

  if (recent.length >= config.maxRequests) {
    rateLimitStore.set(key, { timestamps: recent });
    return false;
  }

  recent.push(now);
  rateLimitStore.set(key, { timestamps: recent });
  return true;
}

function getRequestFingerprint(headerStore: Awaited<ReturnType<typeof headers>>): string {
  const forwardedFor = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = headerStore.get('x-real-ip')?.trim();
  const userAgent = headerStore.get('user-agent')?.slice(0, 80) ?? 'unknown';

  return `${forwardedFor ?? realIp ?? 'unknown'}:${userAgent}`;
}

function getDistinctValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isDogSize(value: string): value is DogSize {
  return BOOKING_SIZE_OPTIONS.some((option) => option.value === value);
}

function isCutType(value: string): value is CutType {
  return BOOKING_CUT_TYPES.some((option) => option.value === value);
}

function isBookingAddonCode(value: string): value is BookingAddonCode {
  return BOOKING_ADDONS.some((addon) => addon.code === value);
}

export async function submitBooking(
  _previousState: BookingSubmitState,
  formData: FormData,
): Promise<BookingSubmitState> {
  const honeypot = normalizeBookingText(formData.get('company'));

  if (honeypot) {
    return { status: 'error', message: 'Žiadosť sa nepodarilo odoslať.' };
  }

  const dogName = normalizeBookingText(formData.get('dogName'));
  const dogBreed = normalizeBookingText(formData.get('dogBreed'));
  const dogSize = normalizeBookingText(formData.get('dogSize'));
  const dogNote = normalizeBookingText(formData.get('dogNote'));
  const selectedDate = normalizeBookingText(formData.get('selectedDate'));
  const selectedTime = normalizeBookingText(formData.get('selectedTime'));
  const cutType = normalizeBookingText(formData.get('cutType'));
  const customerName = normalizeBookingText(formData.get('customerName'));
  const customerPhone = normalizeBookingPhone(normalizeBookingText(formData.get('customerPhone')));
  const customerEmail = normalizeBookingText(formData.get('customerEmail'));
  const sourceCode = normalizeBookingText(formData.get('sourceCode')) || null;
  const rawAddonCodes = getDistinctValues(
    formData.getAll('serviceIds').map((value) => normalizeBookingText(value)),
  );
  const selectedAddonCodes = rawAddonCodes.filter((value): value is BookingAddonCode =>
    isBookingAddonCode(value),
  );

  if (
    !dogName ||
    !dogBreed ||
    !dogSize ||
    !selectedDate ||
    !selectedTime ||
    !cutType ||
    !customerName ||
    !customerPhone
  ) {
    return { status: 'error', message: 'Skontrolujte, či sú vyplnené všetky povinné polia.' };
  }

  if (!BOOKING_PHONE_PATTERN.test(customerPhone)) {
    return { status: 'error', message: 'Telefón nie je v správnom formáte.' };
  }

  if (!isDogSize(dogSize) || !isCutType(cutType)) {
    return { status: 'error', message: 'Skontrolujte, či sú vyplnené všetky povinné polia.' };
  }

  if (rawAddonCodes.length !== selectedAddonCodes.length) {
    return { status: 'error', message: 'Vybrané doplnky už nie sú dostupné.' };
  }

  const headerStore = await headers();
  const requestFingerprint = getRequestFingerprint(headerStore);

  if (!takeRateLimitSlot(`request:${requestFingerprint}`, REQUEST_LIMIT)) {
    return { status: 'error', message: 'Žiadosť sa odosiela príliš často. Skúste to znovu o chvíľu.' };
  }

  if (!takeRateLimitSlot(`phone:${customerPhone}`, PHONE_LIMIT)) {
    return { status: 'error', message: 'Na tento telefón sme už prijali viac žiadostí. Skúste to neskôr.' };
  }

  if (!isBookingDateAllowed(selectedDate)) {
    return { status: 'error', message: 'Vybraný termín nie je v povolenom rozsahu.' };
  }

  if (!getOpenBookingSlots(selectedDate).includes(selectedTime)) {
    return { status: 'error', message: 'Vybraný čas nie je v povolenom rozsahu.' };
  }

  const prisma = getPrisma();
  const requestedStart = localDateTimeToUtc(selectedDate, selectedTime);
  const durationMin = estimateReservationDurationMin(dogSize, cutType, selectedAddonCodes);

  try {
    await prisma.$transaction(async (transaction) => {
      const existingCustomer = await transaction.customer.findFirst({
        where: {
          phone: customerPhone,
        },
      });

      const customer = existingCustomer
        ? await transaction.customer.update({
            where: {
              id: existingCustomer.id,
            },
            data: {
              name: customerName,
              phone: customerPhone,
              email: customerEmail || existingCustomer.email,
            },
          })
        : await transaction.customer.create({
            data: {
              name: customerName,
              phone: customerPhone,
              email: customerEmail || null,
              note: null,
            },
          });

      const dog = await transaction.dog.create({
        data: {
          customerId: customer.id,
          name: dogName,
          breed: dogBreed || null,
          size: dogSize,
          temperamentNote: dogNote || null,
          healthNote: null,
        },
      });

      const reservation = await transaction.reservation.create({
        data: {
          dogId: dog.id,
          serviceIds: selectedAddonCodes,
          status: 'PENDING',
          requestedStart,
          durationMin,
          customerMessage: null,
          internalNote: null,
          sourceCode,
        },
      });

      await transaction.$executeRaw`
        UPDATE "Reservation"
        SET "cutType" = ${cutType}
        WHERE "id" = ${reservation.id}
      `;
    });

    revalidatePath('/rezervacia');
    return { status: 'success' };
  } catch (error) {
    console.error('Failed to create reservation request:', error);
    return { status: 'error', message: 'Žiadosť sa nepodarilo uložiť. Skúste to, prosím, znova.' };
  }
}
