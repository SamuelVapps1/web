'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { localDateTimeToUtc } from '@/lib/time';
import { getPrisma } from '@/lib/prisma';
import {
  BOOKING_ADDONS,
  BOOKING_CUT_TYPES,
  BOOKING_SIZE_OPTIONS,
  estimateReservationDurationMin,
  getOpenBookingSlots,
  isBookingDateAllowed,
  normalizeBookingText,
  type BookingAddonCode,
  type CutType,
  type DogSize,
} from '@/lib/booking';
import {
  validateBookingContactFields,
  type BookingContactFieldErrors,
} from '@/lib/validation/phone';

function formatSpacedPhone(compactPhone: string): string | null {
  const match = compactPhone.match(/^\+421(\d{3})(\d{3})(\d{3})$/);
  return match ? `+421 ${match[1]} ${match[2]} ${match[3]}` : null;
}

function getPhoneLookupVariants(normalizedPhone: string): string[] {
  const variants = [normalizedPhone];
  const spaced = formatSpacedPhone(normalizedPhone);
  if (spaced) {
    variants.push(spaced);
  }
  return variants;
}

export type BookingSubmitState =
  | { status: 'idle' }
  | { status: 'error'; fieldErrors: BookingContactFieldErrors; formError?: string }
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

function buildFormError(message: string): BookingSubmitState {
  return { status: 'error', fieldErrors: {}, formError: message };
}

export async function submitBooking(
  _previousState: BookingSubmitState,
  formData: FormData,
): Promise<BookingSubmitState> {
  const honeypot = normalizeBookingText(formData.get('contact_time'));

  if (honeypot) {
    return { status: 'success' };
  }

  const dogName = normalizeBookingText(formData.get('dogName'));
  const dogBreed = normalizeBookingText(formData.get('dogBreed'));
  const dogSize = normalizeBookingText(formData.get('dogSize'));
  const dogNote = normalizeBookingText(formData.get('dogNote'));
  const selectedDate = normalizeBookingText(formData.get('selectedDate'));
  const selectedTime = normalizeBookingText(formData.get('selectedTime'));
  const cutType = normalizeBookingText(formData.get('cutType'));
  const customerName = normalizeBookingText(formData.get('customerName'));
  const customerPhone = normalizeBookingText(formData.get('customerPhone'));
  const customerEmail = normalizeBookingText(formData.get('customerEmail'));
  const sourceCode = normalizeBookingText(formData.get('sourceCode')) || null;
  const rawAddonCodes = getDistinctValues(
    formData.getAll('serviceIds').map((value) => normalizeBookingText(value)),
  );
  const selectedAddonCodes = rawAddonCodes.filter((value): value is BookingAddonCode =>
    isBookingAddonCode(value),
  );

  const contactValidation = validateBookingContactFields({
    customerName,
    customerPhone,
    customerEmail,
  });

  if (Object.keys(contactValidation.fieldErrors).length > 0) {
    return { status: 'error', fieldErrors: contactValidation.fieldErrors };
  }

  if (!dogName || !dogBreed || !dogSize || !selectedDate || !selectedTime || !cutType) {
    return buildFormError('Skontrolujte údaje v predchádzajúcich krokoch.');
  }

  if (!isDogSize(dogSize) || !isCutType(cutType)) {
    return buildFormError('Skontrolujte údaje v predchádzajúcich krokoch.');
  }

  if (rawAddonCodes.length !== selectedAddonCodes.length) {
    return buildFormError('Vybrané doplnky už nie sú dostupné.');
  }

  const headerStore = await headers();
  const requestFingerprint = getRequestFingerprint(headerStore);

  if (!takeRateLimitSlot(`request:${requestFingerprint}`, REQUEST_LIMIT)) {
    return buildFormError('Príliš veľa pokusov. Skúste to o chvíľu znova.');
  }

  if (!takeRateLimitSlot(`phone:${contactValidation.normalizedPhone}`, PHONE_LIMIT)) {
    return buildFormError('Príliš veľa pokusov. Skúste to o chvíľu znova.');
  }

  if (!isBookingDateAllowed(selectedDate)) {
    return buildFormError('Vybraný termín nie je v povolenom rozsahu.');
  }

  if (!getOpenBookingSlots(selectedDate).includes(selectedTime)) {
    return buildFormError('Vybraný čas nie je v povolenom rozsahu.');
  }

  const prisma = getPrisma();
  const requestedStart = localDateTimeToUtc(selectedDate, selectedTime);
  const durationMin = estimateReservationDurationMin(dogSize, cutType, selectedAddonCodes);
  const normalizedPhone = contactValidation.normalizedPhone;
  const normalizedEmail = customerEmail.trim();

  try {
    await prisma.$transaction(async (transaction) => {
      const phoneVariants = getPhoneLookupVariants(normalizedPhone);
      const existingCustomer = await transaction.customer.findFirst({
        where: {
          phone: { in: phoneVariants },
        },
      });

      let customer = existingCustomer;
      if (!customer) {
        customer = await transaction.customer.create({
          data: {
            name: customerName,
            phone: normalizedPhone,
            email: normalizedEmail || null,
            note: null,
          },
        });
      } else if (!customer.email && normalizedEmail) {
        customer = await transaction.customer.update({
          where: {
            id: customer.id,
          },
          data: {
            email: normalizedEmail,
          },
        });
      }

      const submittedCustomerName = customerName.trim();
      const internalNote =
        existingCustomer && submittedCustomerName && submittedCustomerName.toLowerCase() !== existingCustomer.name.toLowerCase()
          ? `Vo formulári uviedol meno: ${submittedCustomerName}`
          : null;

      const existingDog = await transaction.dog.findFirst({
        where: {
          customerId: customer.id,
          name: {
            equals: dogName,
            mode: 'insensitive',
          },
        },
      });

      const dog = existingDog
        ? await transaction.dog.update({
            where: { id: existingDog.id },
            data: {
              breed: dogBreed || null,
              size: dogSize,
              temperamentNote: dogNote || null,
            },
          })
        : await transaction.dog.create({
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
          internalNote,
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
    return buildFormError('Nepodarilo sa odoslať žiadosť. Skúste to znova alebo zavolajte na +421 944 240 116.');
  }
}
