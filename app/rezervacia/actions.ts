'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getPrisma } from '@/lib/prisma';
import {
  BOOKING_PHONE_PATTERN,
  buildBookingStart,
  getAllowedBookingTimes,
  isBookingDateAllowed,
  normalizeBookingPhone,
  normalizeBookingText,
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

export async function submitBooking(
  _previousState: BookingSubmitState,
  formData: FormData,
): Promise<BookingSubmitState> {
  const prisma = getPrisma();
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
  const customerName = normalizeBookingText(formData.get('customerName'));
  const customerPhone = normalizeBookingPhone(normalizeBookingText(formData.get('customerPhone')));
  const customerEmail = normalizeBookingText(formData.get('customerEmail'));
  const customerMessage = normalizeBookingText(formData.get('customerMessage'));
  const sourceCode = normalizeBookingText(formData.get('sourceCode')) || null;
  const selectedServiceNames = getDistinctValues(
    formData.getAll('serviceIds').map((value) => normalizeBookingText(value)),
  );

  if (
    !dogName ||
    !dogBreed ||
    !dogSize ||
    !selectedDate ||
    !selectedTime ||
    !customerName ||
    !customerPhone ||
    selectedServiceNames.length === 0
  ) {
    return { status: 'error', message: 'Skontrolujte, či sú vyplnené všetky povinné polia.' };
  }

  if (!BOOKING_PHONE_PATTERN.test(customerPhone)) {
    return { status: 'error', message: 'Telefón nie je v správnom formáte.' };
  }

  const headerStore = await headers();
  const requestFingerprint = getRequestFingerprint(headerStore);

  if (!takeRateLimitSlot(`request:${requestFingerprint}`, REQUEST_LIMIT)) {
    return { status: 'error', message: 'Žiadosť sa odosiela príliš často. Skúste to znovu o chvíľu.' };
  }

  if (!takeRateLimitSlot(`phone:${customerPhone}`, PHONE_LIMIT)) {
    return { status: 'error', message: 'Na tento telefón sme už prijali viac žiadostí. Skúste to neskôr.' };
  }

  const services = await prisma.service.findMany({
    where: {
      name: {
        in: selectedServiceNames,
      },
    },
  });

  if (services.length !== selectedServiceNames.length) {
    return { status: 'error', message: 'Vybrané služby už nie sú dostupné.' };
  }

  const durationMin = services.reduce((total, service) => total + service.baseDurationMin, 0);
  const availableTimes = getAllowedBookingTimes(selectedDate, durationMin);

  if (!isBookingDateAllowed(selectedDate) || !availableTimes.includes(selectedTime)) {
    return { status: 'error', message: 'Vybraný termín už nie je dostupný.' };
  }

  const requestedStart = buildBookingStart(selectedDate, selectedTime);

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
              note: customerMessage || existingCustomer.note,
            },
          })
        : await transaction.customer.create({
            data: {
              name: customerName,
              phone: customerPhone,
              email: customerEmail || null,
              note: customerMessage || null,
            },
          });

      const dog = await transaction.dog.create({
        data: {
          customerId: customer.id,
          name: dogName,
          breed: dogBreed || null,
          size: dogSize as 'SMALL' | 'MEDIUM' | 'LARGE',
          temperamentNote: dogNote || null,
          healthNote: null,
        },
      });

      await transaction.reservation.create({
        data: {
          dogId: dog.id,
          serviceIds: selectedServiceNames,
          status: 'PENDING',
          requestedStart,
          durationMin,
          customerMessage: customerMessage || null,
          internalNote: null,
          sourceCode,
        },
      });
    });

    revalidatePath('/rezervacia');
    return { status: 'success' };
  } catch (error) {
    console.error('Failed to create reservation request:', error);
    return { status: 'error', message: 'Žiadosť sa nepodarilo uložiť. Skúste to, prosím, znova.' };
  }
}
