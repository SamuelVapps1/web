'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { CutType } from '@prisma/client';
import { z } from 'zod';
import { BOOKING_ADDONS, BOOKING_CUT_TYPES } from '@/lib/booking';
import { getPrisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin-session';
import { ADMIN_CUSTOMER_TAGS } from '@/lib/admin-domain';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  buildDateTimeFromForm,
  findReservationCollisions,
  fitsSalonHours,
  type ReservationCollisionDTO,
  type ScheduleReservation,
} from '@/lib/admin-schedule.js';

const phonePattern = /^(?:\+421|0)\s?\d{3}\s?\d{3}\s?\d{3}$/;
const cutTypeValues = BOOKING_CUT_TYPES.map((item) => item.value) as [string, ...string[]];
const addonValues = BOOKING_ADDONS.map((item) => item.code) as [string, ...string[]];
const dogSizeValues = ['SMALL', 'MEDIUM', 'LARGE'] as const;
const noteTargetValues = ['customer', 'dog', 'reservation'] as const;
const noteKindValues = ['temperament', 'health'] as const;
const customerTagValues = ADMIN_CUSTOMER_TAGS.map((item) => item.value) as [string, ...string[]];

export type AdminActionState =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'warning'; message: string; collisions: ReservationCollisionDTO[] };

export type AdminLoginState = {
  error?: string;
} | undefined;

const idleState: AdminActionState = { kind: 'idle' };

const reservationTimingSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.coerce.number().int().min(30).max(240).refine((value) => value % 30 === 0, {
    message: 'Trvanie musí byť po 30 minútach.',
  }),
  internalNote: z.string().trim().max(4000).optional().or(z.literal('')),
});

const manualReservationSchema = z.object({
  customerId: z.string().uuid().optional().or(z.literal('')),
  customerName: z.string().trim().min(1, 'Meno zákazníka je povinné.'),
  customerPhone: z.string().trim().min(1, 'Telefón je povinný.'),
  customerEmail: z.string().trim().email().optional().or(z.literal('')),
  customerNote: z.string().trim().max(4000).optional().or(z.literal('')),
  dogId: z.string().uuid().optional().or(z.literal('')),
  dogName: z.string().trim().min(1, 'Meno psa je povinné.'),
  dogBreed: z.string().trim().optional().or(z.literal('')),
  dogSize: z.enum(dogSizeValues),
  dogNote: z.string().trim().max(4000).optional().or(z.literal('')),
  temperamentNote: z.string().trim().max(4000).optional().or(z.literal('')),
  coatType: z.string().trim().optional().or(z.literal('')),
  healthNote: z.string().trim().max(4000).optional().or(z.literal('')),
  groomingNotes: z.string().trim().max(4000).optional().or(z.literal('')),
  cutType: z.enum(cutTypeValues),
  serviceIds: z.array(z.enum(addonValues)).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.coerce.number().int().min(30).max(240).refine((value) => value % 30 === 0, {
    message: 'Trvanie musí byť po 30 minútach.',
  }),
  internalNote: z.string().trim().max(4000).optional().or(z.literal('')),
});

const customerSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(1, 'Meno zákazníka je povinné.'),
  phone: z.string().trim().min(1, 'Telefón je povinný.'),
  email: z.string().trim().email().optional().or(z.literal('')),
  note: z.string().trim().max(4000).optional().or(z.literal('')),
  tags: z.array(z.enum(customerTagValues)).default([]),
});

const dogSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  customerId: z.string().uuid(),
  name: z.string().trim().min(1, 'Meno psa je povinné.'),
  breed: z.string().trim().optional().or(z.literal('')),
  size: z.enum(dogSizeValues),
  note: z.string().trim().max(4000).optional().or(z.literal('')),
  temperamentNote: z.string().trim().max(4000).optional().or(z.literal('')),
  coatType: z.string().trim().optional().or(z.literal('')),
  healthNote: z.string().trim().max(4000).optional().or(z.literal('')),
  groomingNotes: z.string().trim().max(4000).optional().or(z.literal('')),
});

const noteSchema = z.object({
  target: z.enum(noteTargetValues),
  id: z.string().uuid(),
  kind: z.enum(noteKindValues).optional(),
  note: z.string().trim().max(4000).optional().or(z.literal('')),
});

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('421')) {
    return `+421 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+421 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  }

  return value.trim();
}

function normalizeText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveFormData(
  stateOrFormData: unknown,
  maybeFormData?: FormData,
): FormData {
  return stateOrFormData instanceof FormData ? stateOrFormData : maybeFormData ?? new FormData();
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function toCollisionReservations(rows: {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED';
  confirmedStart: Date | null;
  requestedStart: Date;
  durationMin: number;
  dog: {
    name: string;
    customer: {
      name: string;
      phone: string;
    };
  };
}[]): ScheduleReservation[] {
  return rows.map((reservation) => {
    const start = reservation.confirmedStart ?? reservation.requestedStart;
    const end = new Date(start.getTime() + reservation.durationMin * 60 * 1000);

    return {
      id: reservation.id,
      status: reservation.status,
      start,
      end,
      customerName: reservation.dog.customer.name,
      dogName: reservation.dog.name,
      phone: reservation.dog.customer.phone,
    };
  });
}

async function loadConfirmedReservationsOnDate(date: string, excludeId?: string) {
  const prisma = getPrisma();
  const start = buildDateTimeFromForm(date, '00:00');
  const end = buildDateTimeFromForm(date, '23:59');

  const reservations = await prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        { confirmedStart: { gte: start, lt: end } },
        { requestedStart: { gte: start, lt: end } },
      ],
    },
    include: {
      dog: {
        include: {
          customer: true,
        },
      },
    },
  });

  return toCollisionReservations(reservations);
}

function refreshAdminViews() {
  revalidatePath('/admin');
  revalidatePath('/admin/reservations');
  revalidatePath('/admin/calendar');
  revalidatePath('/admin/customers');
}

async function saveReservationTiming(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  params: {
    reservationId: string;
    start: Date;
    end: Date;
    durationMin: number;
    internalNote?: string | null;
    status: 'CONFIRMED' | 'PENDING';
    persistRequestedStart?: boolean;
  },
  date: string,
) {
  const collisions = findReservationCollisions(
    { id: params.reservationId, start: params.start, end: params.end },
    await loadConfirmedReservationsOnDate(date, params.reservationId),
  );

  const data: Record<string, unknown> = {
    status: params.status,
    durationMin: params.durationMin,
    internalNote: params.internalNote ?? null,
  };

  if (params.status === 'CONFIRMED') {
    data.confirmedStart = params.start;
  }

  if (params.persistRequestedStart) {
    data.requestedStart = params.start;
  }

  const updated = await prisma.reservation.update({
    where: {
      id: params.reservationId,
    },
    data,
    include: {
      dog: {
        include: {
          customer: true,
        },
      },
    },
  });

  return {
    updated,
    collisions,
  };
}

function buildSuccess(message: string): AdminActionState {
  return { kind: 'success', message };
}

function buildError(message: string): AdminActionState {
  return { kind: 'error', message };
}

function buildWarning(message: string, collisions: ReservationCollisionDTO[]): AdminActionState {
  return { kind: 'warning', message, collisions };
}

export async function loginAdmin(
  stateOrFormData: AdminLoginState | FormData,
  maybeFormData?: FormData,
): Promise<AdminLoginState> {
  const formData = resolveFormData(stateOrFormData, maybeFormData);
  const email = normalizeText(formData.get('email'));
  const password = normalizeText(formData.get('password'));

  if (!email || !password) {
    return { error: 'Zadaj email aj heslo.' };
  }

  const supabase = await createSupabaseServerClient({ mutable: true });
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Prihlásenie zlyhalo. Skontroluj údaje a skús znova.' };
  }

  redirect('/admin');
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient({ mutable: true });
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function confirmReservation(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const parsed = reservationTimingSchema.safeParse({
    id: formData.get('id'),
    date: formData.get('date'),
    time: formData.get('time'),
    durationMin: formData.get('durationMin'),
    internalNote: formData.get('internalNote'),
  });

  if (!parsed.success) {
    return buildError(getErrorMessage(parsed.error, 'Potvrdenie sa nepodarilo uložiť.'));
  }

  const prisma = getPrisma();
  const start = buildDateTimeFromForm(parsed.data.date, parsed.data.time);
  const end = new Date(start.getTime() + parsed.data.durationMin * 60 * 1000);

  if (!fitsSalonHours(start, end)) {
    return buildError('Termín musí byť v pracovnom čase salóna.');
  }

  const result = await saveReservationTiming(
    prisma,
    {
      reservationId: parsed.data.id,
      start,
      end,
      durationMin: parsed.data.durationMin,
      internalNote: normalizeOptionalText(parsed.data.internalNote),
      status: 'CONFIRMED',
      persistRequestedStart: false,
    },
    parsed.data.date,
  );

  refreshAdminViews();

  if (result.collisions.length > 0) {
    return buildWarning('Potvrdené, ale tento termín sa prekrýva s inou rezerváciou.', result.collisions);
  }

  return buildSuccess('Rezervácia bola potvrdená.');
}

export async function declineReservation(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const id = normalizeText(formData.get('id'));
  if (!id) {
    return buildError('Chýba identifikátor rezervácie.');
  }

  const prisma = getPrisma();
  await prisma.reservation.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  refreshAdminViews();
  return buildSuccess('Žiadosť bola zamietnutá.');
}

export async function completeReservation(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const id = normalizeText(formData.get('id'));
  if (!id) {
    return buildError('Chýba identifikátor rezervácie.');
  }

  const prisma = getPrisma();
  await prisma.reservation.update({
    where: { id },
    data: { status: 'DONE' },
  });

  refreshAdminViews();
  return buildSuccess('Rezervácia je označená ako dokončená.');
}

export async function cancelReservation(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const id = normalizeText(formData.get('id'));
  if (!id) {
    return buildError('Chýba identifikátor rezervácie.');
  }

  const prisma = getPrisma();
  await prisma.reservation.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  refreshAdminViews();
  return buildSuccess('Rezervácia bola zrušená.');
}

export async function updateReservation(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const parsed = reservationTimingSchema.safeParse({
    id: formData.get('id'),
    date: formData.get('date'),
    time: formData.get('time'),
    durationMin: formData.get('durationMin'),
    internalNote: formData.get('internalNote'),
  });

  if (!parsed.success) {
    return buildError(getErrorMessage(parsed.error, 'Zmena rezervácie sa nepodarila.'));
  }

  const prisma = getPrisma();
  const start = buildDateTimeFromForm(parsed.data.date, parsed.data.time);
  const end = new Date(start.getTime() + parsed.data.durationMin * 60 * 1000);

  if (!fitsSalonHours(start, end)) {
    return buildError('Termín musí byť v pracovnom čase salóna.');
  }

  const result = await saveReservationTiming(
    prisma,
    {
      reservationId: parsed.data.id,
      start,
      end,
      durationMin: parsed.data.durationMin,
      internalNote: normalizeOptionalText(parsed.data.internalNote),
      status: 'CONFIRMED',
      persistRequestedStart: false,
    },
    parsed.data.date,
  );

  refreshAdminViews();

  if (result.collisions.length > 0) {
    return buildWarning('Uložené, ale termín sa prekrýva s inou rezerváciou.', result.collisions);
  }

  return buildSuccess('Rezervácia bola upravená.');
}

export async function createCustomer(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const parsed = customerSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    note: formData.get('note'),
    tags: formData.getAll('tags'),
  });

  if (!parsed.success) {
    return buildError(getErrorMessage(parsed.error, 'Zákazníka sa nepodarilo uložiť.'));
  }

  if (!phonePattern.test(normalizePhone(parsed.data.phone))) {
    return buildError('Telefón nie je v správnom formáte.');
  }

  const prisma = getPrisma();
  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      phone: normalizePhone(parsed.data.phone),
      email: normalizeOptionalText(parsed.data.email),
      note: normalizeOptionalText(parsed.data.note),
      tags: parsed.data.tags,
    },
  });

  refreshAdminViews();
  return buildSuccess(`Zákazník ${customer.name} bol pridaný.`);
}

export async function updateCustomer(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const parsed = customerSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    note: formData.get('note'),
    tags: formData.getAll('tags'),
  });

  if (!parsed.success || !parsed.data.id) {
    return buildError('Zákazníka sa nepodarilo uložiť.');
  }

  if (!phonePattern.test(normalizePhone(parsed.data.phone))) {
    return buildError('Telefón nie je v správnom formáte.');
  }

  const prisma = getPrisma();
  await prisma.customer.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      phone: normalizePhone(parsed.data.phone),
      email: normalizeOptionalText(parsed.data.email),
      note: normalizeOptionalText(parsed.data.note),
      tags: parsed.data.tags,
    },
  });

  refreshAdminViews();
  return buildSuccess('Zákazník bol aktualizovaný.');
}

export async function createDog(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const parsed = dogSchema.safeParse({
    id: formData.get('id'),
    customerId: formData.get('customerId'),
    name: formData.get('name'),
    breed: formData.get('breed'),
    size: formData.get('size'),
    note: formData.get('note'),
    temperamentNote: formData.get('temperamentNote'),
    coatType: formData.get('coatType'),
    healthNote: formData.get('healthNote'),
    groomingNotes: formData.get('groomingNotes'),
  });

  if (!parsed.success) {
    return buildError(getErrorMessage(parsed.error, 'Psa sa nepodarilo uložiť.'));
  }

  const prisma = getPrisma();
  const dog = await prisma.dog.create({
    data: {
      customerId: parsed.data.customerId,
      name: parsed.data.name,
      breed: normalizeOptionalText(parsed.data.breed),
      size: parsed.data.size,
      note: normalizeOptionalText(parsed.data.note),
      temperamentNote: normalizeOptionalText(parsed.data.temperamentNote),
      coatType: normalizeOptionalText(parsed.data.coatType),
      healthNote: normalizeOptionalText(parsed.data.healthNote),
      groomingNotes: normalizeOptionalText(parsed.data.groomingNotes),
    },
  });

  refreshAdminViews();
  return buildSuccess(`Pes ${dog.name} bol pridaný.`);
}

export async function updateDog(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const parsed = dogSchema.safeParse({
    id: formData.get('id'),
    customerId: formData.get('customerId'),
    name: formData.get('name'),
    breed: formData.get('breed'),
    size: formData.get('size'),
    note: formData.get('note'),
    temperamentNote: formData.get('temperamentNote'),
    coatType: formData.get('coatType'),
    healthNote: formData.get('healthNote'),
    groomingNotes: formData.get('groomingNotes'),
  });

  if (!parsed.success || !parsed.data.id) {
    return buildError('Psa sa nepodarilo uložiť.');
  }

  const prisma = getPrisma();
  await prisma.dog.update({
    where: { id: parsed.data.id },
    data: {
      customerId: parsed.data.customerId,
      name: parsed.data.name,
      breed: normalizeOptionalText(parsed.data.breed),
      size: parsed.data.size,
      note: normalizeOptionalText(parsed.data.note),
      temperamentNote: normalizeOptionalText(parsed.data.temperamentNote),
      coatType: normalizeOptionalText(parsed.data.coatType),
      healthNote: normalizeOptionalText(parsed.data.healthNote),
      groomingNotes: normalizeOptionalText(parsed.data.groomingNotes),
    },
  });

  refreshAdminViews();
  return buildSuccess('Pes bol aktualizovaný.');
}

export async function updateNotes(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const parsed = noteSchema.safeParse({
    target: formData.get('target'),
    id: formData.get('id'),
    kind: formData.get('kind'),
    note: formData.get('note'),
  });

  if (!parsed.success) {
    return buildError(getErrorMessage(parsed.error, 'Poznámku sa nepodarilo uložiť.'));
  }

  const prisma = getPrisma();

  if (parsed.data.target === 'customer') {
    await prisma.customer.update({
      where: { id: parsed.data.id },
      data: {
        note: normalizeOptionalText(parsed.data.note),
      },
    });
  }

  if (parsed.data.target === 'reservation') {
    await prisma.reservation.update({
      where: { id: parsed.data.id },
      data: {
        internalNote: normalizeOptionalText(parsed.data.note),
      },
    });
  }

  if (parsed.data.target === 'dog') {
    if (!parsed.data.kind) {
      return buildError('Vyber, či chceš upraviť poznámku o povahe alebo o zdraví.');
    }

    await prisma.dog.update({
      where: { id: parsed.data.id },
      data: parsed.data.kind === 'temperament'
        ? { temperamentNote: normalizeOptionalText(parsed.data.note) }
        : { healthNote: normalizeOptionalText(parsed.data.note) },
    });
  }

  refreshAdminViews();
  return buildSuccess('Poznámka bola uložená.');
}

export async function createManualReservation(
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
): Promise<AdminActionState> {
  await requireAdminUser();

  const formData = resolveFormData(stateOrFormData, maybeFormData);

  const raw = {
    customerId: formData.get('customerId'),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    customerEmail: formData.get('customerEmail'),
    customerNote: formData.get('customerNote'),
    dogId: formData.get('dogId'),
    dogName: formData.get('dogName'),
    dogBreed: formData.get('dogBreed'),
    dogSize: formData.get('dogSize'),
    dogNote: normalizeText(formData.get('dogNote')),
    temperamentNote: formData.get('temperamentNote'),
    coatType: normalizeText(formData.get('coatType')),
    healthNote: formData.get('healthNote'),
    groomingNotes: normalizeText(formData.get('groomingNotes')),
    cutType: formData.get('cutType'),
    serviceIds: formData.getAll('serviceIds'),
    date: formData.get('date'),
    time: formData.get('time'),
    durationMin: formData.get('durationMin'),
    internalNote: formData.get('internalNote'),
  };

  const parsed = manualReservationSchema.safeParse(raw);
  if (!parsed.success) {
    return buildError(getErrorMessage(parsed.error, 'Rezerváciu sa nepodarilo uložiť.'));
  }

  const prisma = getPrisma();
  const customerPhone = normalizePhone(parsed.data.customerPhone);
  if (!phonePattern.test(customerPhone)) {
    return buildError('Telefón nie je v správnom formáte.');
  }

  const start = buildDateTimeFromForm(parsed.data.date, parsed.data.time);
  const end = new Date(start.getTime() + parsed.data.durationMin * 60 * 1000);

  if (!fitsSalonHours(start, end)) {
    return buildError('Termín musí byť v pracovnom čase salóna.');
  }

  const dogNote = parsed.data.dogNote ?? '';
  const temperamentNote = parsed.data.temperamentNote ?? '';
  const coatType = parsed.data.coatType ?? '';
  const healthNote = parsed.data.healthNote ?? '';
  const groomingNotes = parsed.data.groomingNotes ?? '';

  const customer = parsed.data.customerId
    ? await prisma.customer.update({
        where: { id: parsed.data.customerId },
        data: {
          name: parsed.data.customerName,
          phone: customerPhone,
          email: normalizeOptionalText(parsed.data.customerEmail),
          note: normalizeOptionalText(parsed.data.customerNote),
        },
      })
    : await prisma.customer.create({
        data: {
          name: parsed.data.customerName,
          phone: customerPhone,
          email: normalizeOptionalText(parsed.data.customerEmail),
          note: normalizeOptionalText(parsed.data.customerNote),
        },
      });

  const dogProfileData = {
    customerId: customer.id,
    name: parsed.data.dogName,
    breed: normalizeOptionalText(parsed.data.dogBreed),
    size: parsed.data.dogSize,
    ...(dogNote.trim() ? { note: normalizeOptionalText(dogNote) } : {}),
    ...(temperamentNote.trim() ? { temperamentNote: normalizeOptionalText(temperamentNote) } : {}),
    ...(coatType.trim() ? { coatType: normalizeOptionalText(coatType) } : {}),
    ...(healthNote.trim() ? { healthNote: normalizeOptionalText(healthNote) } : {}),
    ...(groomingNotes.trim() ? { groomingNotes: normalizeOptionalText(groomingNotes) } : {}),
  };

  const dog = parsed.data.dogId
    ? await prisma.dog.update({
        where: { id: parsed.data.dogId },
        data: dogProfileData,
      })
    : await prisma.dog.create({
        data: dogProfileData,
      });

  const reservation = await prisma.reservation.create({
    data: {
      dogId: dog.id,
      serviceIds: parsed.data.serviceIds,
      status: 'CONFIRMED',
      requestedStart: start,
      confirmedStart: start,
      cutType: parsed.data.cutType as CutType,
      durationMin: parsed.data.durationMin,
      customerMessage: null,
      internalNote: normalizeOptionalText(parsed.data.internalNote),
    },
    include: {
      dog: {
        include: {
          customer: true,
        },
      },
    },
  });

  const collisions = findReservationCollisions(
    { id: reservation.id, start, end },
    toCollisionReservations(
      await prisma.reservation.findMany({
        where: {
          status: 'CONFIRMED',
          id: {
            not: reservation.id,
          },
          OR: [
            { confirmedStart: { gte: buildDateTimeFromForm(parsed.data.date, '00:00'), lt: buildDateTimeFromForm(parsed.data.date, '23:59') } },
            { requestedStart: { gte: buildDateTimeFromForm(parsed.data.date, '00:00'), lt: buildDateTimeFromForm(parsed.data.date, '23:59') } },
          ],
        },
        include: {
          dog: {
            include: {
              customer: true,
            },
          },
        },
      }),
    ),
  );

  refreshAdminViews();

  if (collisions.length > 0) {
    return buildWarning('Rezervácia bola uložená, ale prekrýva sa s inou rezerváciou.', collisions);
  }

  return buildSuccess(`Rezervácia pre ${customer.name} a psa ${dog.name} bola vytvorená.`);
}

export async function resetAdminActionState(): Promise<AdminActionState> {
  return idleState;
}
