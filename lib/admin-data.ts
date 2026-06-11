import 'server-only';

import type { ReservationStatus, Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { addDaysToDateKey, endOfBratislavaDayUtc, formatBratislavaDate, formatBratislavaDateTime, formatTimeKey, getBratislavaDateKey, localDateTimeToUtc, startOfBratislavaDayUtc } from '@/lib/time';
import { getAddonLabels, getCutTypeLabel, getDogSizeLabel, getEffectiveReservationEnd, getEffectiveReservationStart, getMonthLabel, getReservationStatusLabel, getWeekRangeLabel, shiftDateKey, shiftMonthKey, type AdminCalendarView, type AdminReservationTab } from '@/lib/admin-domain';

type ReservationRelation = Prisma.ReservationGetPayload<{
  include: {
    dog: {
      include: {
        customer: true;
      };
    };
  };
}>;

type CustomerRelation = Prisma.CustomerGetPayload<{
  include: {
    dogs: {
      include: {
        reservations: {
          include: {
            dog: {
              include: {
                customer: true;
              };
            };
          };
        };
      };
    };
  };
}>;

const reservationInclude = {
  dog: {
    include: {
      customer: true,
    },
  },
} satisfies Prisma.ReservationInclude;

const customerInclude = {
  dogs: {
    include: {
      reservations: {
        include: {
          dog: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CustomerInclude;

export type AdminReservationCard = {
  id: string;
  status: ReservationStatus;
  statusLabel: string;
  createdAt: string;
  requestedStart: string;
  confirmedStart: string | null;
  startLabel: string;
  endLabel: string;
  dateLabel: string;
  timeLabel: string;
  durationMin: number;
  cutType: string;
  cutTypeLabel: string;
  serviceIds: string[];
  serviceLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerTags: string[];
  customerNote: string | null;
  dogId: string;
  dogName: string;
  dogBreed: string | null;
  dogSize: string;
  dogSizeLabel: string;
  dogNote: string | null;
  dogTemperamentNote: string | null;
  dogCoatType: string | null;
  dogHealthNote: string | null;
  dogGroomingNotes: string | null;
  customerMessage: string | null;
  internalNote: string | null;
};

export type AdminDashboardData = {
  today: AdminReservationCard[];
  tomorrow: AdminReservationCard[];
  pendingCount: number;
};

export type AdminCustomerCard = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  tags: string[];
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    size: string;
    sizeLabel: string;
  }[];
  reservationCount: number;
  lastVisitLabel: string;
  lastVisitAt: string | null;
};

export type AdminCustomerDetail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  tags: string[];
  createdAt: string;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    size: string;
    sizeLabel: string;
    note: string | null;
    temperamentNote: string | null;
    coatType: string | null;
    healthNote: string | null;
    groomingNotes: string | null;
    reservations: AdminReservationCard[];
  }[];
  reservations: AdminReservationCard[];
};

export type AdminReservationDetail = AdminReservationCard & {
  requestedAtLabel: string;
  requestedTimeLabel: string;
  requestedDateLabel: string;
  requestedStartIso: string;
  confirmedStartIso: string | null;
  availabilityReservations: AdminReservationCard[];
  collisions: {
    id: string;
    customerName: string;
    dogName: string;
    phone: string;
    start: string;
    end: string;
    status: ReservationStatus;
  }[];
};

export type AdminCalendarDay = {
  dateKey: string;
  label: string;
  isCurrentMonth: boolean;
  reservations: AdminReservationCard[];
  pending: AdminReservationCard[];
  history: AdminReservationCard[];
};

export type AdminCalendarData = {
  view: AdminCalendarView;
  anchorDateKey: string;
  titleLabel: string;
  rangeLabel: string;
  previousDateKey: string;
  nextDateKey: string;
  days: AdminCalendarDay[];
};

function mapReservation(record: ReservationRelation): AdminReservationCard {
  const effectiveStart = getEffectiveReservationStart(record.requestedStart, record.confirmedStart);
  const effectiveEnd = getEffectiveReservationEnd(record.requestedStart, record.confirmedStart, record.durationMin);

  return {
    id: record.id,
    status: record.status,
    statusLabel: getReservationStatusLabel(record.status),
    createdAt: record.createdAt.toISOString(),
    requestedStart: record.requestedStart.toISOString(),
    confirmedStart: record.confirmedStart?.toISOString() ?? null,
    startLabel: formatBratislavaDateTime(effectiveStart),
    endLabel: formatTimeKey(effectiveEnd),
    dateLabel: formatBratislavaDate(effectiveStart),
    timeLabel: formatTimeKey(effectiveStart),
    durationMin: record.durationMin,
    cutType: record.cutType,
    cutTypeLabel: getCutTypeLabel(record.cutType),
    serviceIds: record.serviceIds,
    serviceLabel: getAddonLabels(record.serviceIds),
    customerName: record.dog.customer.name,
    customerPhone: record.dog.customer.phone,
    customerEmail: record.dog.customer.email,
    customerTags: record.dog.customer.tags,
    customerNote: record.dog.customer.note,
    dogId: record.dog.id,
    dogName: record.dog.name,
    dogBreed: record.dog.breed,
    dogSize: record.dog.size,
    dogSizeLabel: getDogSizeLabel(record.dog.size),
    dogNote: record.dog.note,
    dogTemperamentNote: record.dog.temperamentNote,
    dogCoatType: record.dog.coatType,
    dogHealthNote: record.dog.healthNote,
    dogGroomingNotes: record.dog.groomingNotes,
    customerMessage: record.customerMessage,
    internalNote: record.internalNote,
  };
}

function mapCustomer(record: CustomerRelation): AdminCustomerCard {
  const allReservations = record.dogs.flatMap((dog) => dog.reservations);
  const orderedReservations = [...allReservations].sort(
    (left, right) => right.requestedStart.getTime() - left.requestedStart.getTime(),
  );
  const lastVisit = orderedReservations.find(
    (reservation) =>
      reservation.status === 'DONE' ||
      (reservation.status === 'CONFIRMED' && reservation.confirmedStart && reservation.confirmedStart <= new Date()),
  );

  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    email: record.email,
    note: record.note,
    tags: Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    dogs: record.dogs.map((dog) => ({
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      size: dog.size,
      sizeLabel: getDogSizeLabel(dog.size),
    })),
    reservationCount: allReservations.length,
    lastVisitAt: lastVisit ? (lastVisit.confirmedStart ?? lastVisit.requestedStart).toISOString() : null,
    lastVisitLabel: lastVisit
      ? formatBratislavaDateTime(lastVisit.confirmedStart ?? lastVisit.requestedStart)
      : 'Ešte bez návštevy',
  };
}

function mapCustomerDetail(record: CustomerRelation): AdminCustomerDetail {
  const allReservations = record.dogs.flatMap((dog) => dog.reservations);
  return {
    ...mapCustomer(record),
    createdAt: record.createdAt.toISOString(),
    dogs: record.dogs.map((dog) => ({
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      size: dog.size,
      sizeLabel: getDogSizeLabel(dog.size),
      note: dog.note,
      temperamentNote: dog.temperamentNote,
      coatType: dog.coatType,
      healthNote: dog.healthNote,
      groomingNotes: dog.groomingNotes,
      reservations: dog.reservations
        .sort((left, right) => right.requestedStart.getTime() - left.requestedStart.getTime())
        .map((reservation) => mapReservation({
          ...reservation,
          dog: {
            ...dog,
            customer: record,
          },
          } as ReservationRelation)),
    })),
    reservations: allReservations
      .sort((left, right) => right.requestedStart.getTime() - left.requestedStart.getTime())
      .map((reservation) => mapReservation({
        ...reservation,
        dog: {
          ...reservation.dog,
          customer: record,
        },
      } as ReservationRelation)),
  };
}

async function loadConfirmedReservationsInRange(startKey: string, endKey: string): Promise<AdminReservationCard[]> {
  const prisma = getPrisma();
  const rangeStart = startOfBratislavaDayUtc(startKey);
  const rangeEnd = endOfBratislavaDayUtc(endKey);

  const reservations = await prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      OR: [{ requestedStart: { lt: rangeEnd } }, { confirmedStart: { lt: rangeEnd } }],
    },
    include: reservationInclude,
    orderBy: {
      requestedStart: 'asc',
    },
  });

  return reservations
    .filter((reservation) => {
      const start = reservation.confirmedStart ?? reservation.requestedStart;
      const end = new Date(start.getTime() + reservation.durationMin * 60 * 1000);
      return start < rangeEnd && end > rangeStart;
    })
    .map(mapReservation);
}

function getWeekRange(anchorDateKey: string) {
  const monday = (() => {
    const date = new Date(localDateTimeToUtc(anchorDateKey, '12:00'));
    const day = date.getUTCDay();
    const delta = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + delta);
    return getBratislavaDateKey(date);
  })();

  const friday = addDaysToDateKey(monday, 4);
  return {
    startKey: monday,
    endKey: friday,
    start: startOfBratislavaDayUtc(monday),
    end: endOfBratislavaDayUtc(friday),
    monday,
    friday,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const prisma = getPrisma();
  const todayKey = getBratislavaDateKey();
  const tomorrowKey = addDaysToDateKey(todayKey, 1);
  const todayStart = startOfBratislavaDayUtc(todayKey);
  const todayEnd = endOfBratislavaDayUtc(todayKey);
  const tomorrowStart = startOfBratislavaDayUtc(tomorrowKey);
  const tomorrowEnd = endOfBratislavaDayUtc(tomorrowKey);

  const [today, tomorrow, pendingCount] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedStart: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: reservationInclude,
      orderBy: {
        confirmedStart: 'asc',
      },
    }),
    prisma.reservation.findMany({
      where: {
        status: 'CONFIRMED',
        confirmedStart: {
          gte: tomorrowStart,
          lt: tomorrowEnd,
        },
      },
      include: reservationInclude,
      orderBy: {
        confirmedStart: 'asc',
      },
    }),
    prisma.reservation.count({
      where: {
        status: 'PENDING',
      },
    }),
  ]);

  return {
    today: today.map(mapReservation),
    tomorrow: tomorrow.map(mapReservation),
    pendingCount,
  };
}

export async function listAdminReservations(tab: AdminReservationTab): Promise<AdminReservationCard[]> {
  const prisma = getPrisma();
  const statusFilter: ReservationStatus[] =
    tab === 'pending'
      ? ['PENDING']
      : tab === 'confirmed'
        ? ['CONFIRMED']
        : ['DONE', 'CANCELLED'];

  const reservations = await prisma.reservation.findMany({
    include: reservationInclude,
    where: {
      status: {
        in: statusFilter,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const mapped = reservations.map(mapReservation);

  if (tab === 'pending') {
    return mapped.sort((left, right) => new Date(right.requestedStart).getTime() - new Date(left.requestedStart).getTime());
  }

  if (tab === 'confirmed') {
    return mapped.sort(
      (left, right) =>
        new Date(left.confirmedStart ?? left.requestedStart).getTime() -
        new Date(right.confirmedStart ?? right.requestedStart).getTime(),
    );
  }

  return mapped.sort(
    (left, right) =>
      new Date(right.confirmedStart ?? right.requestedStart).getTime() -
      new Date(left.confirmedStart ?? left.requestedStart).getTime(),
  );
}

export async function getAdminReservationDetail(id: string): Promise<AdminReservationDetail | null> {
  const prisma = getPrisma();
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude,
  });

  if (!reservation) {
    return null;
  }

  const mapped = mapReservation(reservation);
  const selectedStart = reservation.confirmedStart ?? reservation.requestedStart;
  const availabilityWindowStart = shiftDateKey(getBratislavaDateKey(selectedStart), -30);
  const availabilityWindowEnd = shiftDateKey(getBratislavaDateKey(selectedStart), 30);
  const availabilityReservations = (
    await loadConfirmedReservationsInRange(availabilityWindowStart, availabilityWindowEnd)
  ).filter((item) => item.id !== id);
  const collisions = await prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      id: {
        not: id,
      },
    },
    include: reservationInclude,
  });

  return {
    ...mapped,
    requestedAtLabel: formatBratislavaDateTime(reservation.requestedStart),
    requestedDateLabel: formatBratislavaDate(reservation.requestedStart),
    requestedTimeLabel: formatTimeKey(reservation.requestedStart),
    requestedStartIso: reservation.requestedStart.toISOString(),
    confirmedStartIso: reservation.confirmedStart?.toISOString() ?? null,
    availabilityReservations,
    collisions: collisions
      .filter((item) => {
        const start = item.confirmedStart ?? item.requestedStart;
        const end = new Date(start.getTime() + item.durationMin * 60 * 1000);
        const candidateStart = reservation.confirmedStart ?? reservation.requestedStart;
        const candidateEnd = new Date(candidateStart.getTime() + reservation.durationMin * 60 * 1000);
        return start < candidateEnd && end > candidateStart;
      })
      .map((item) => ({
        id: item.id,
        customerName: item.dog.customer.name,
        dogName: item.dog.name,
        phone: item.dog.customer.phone,
        start: formatTimeKey(item.confirmedStart ?? item.requestedStart),
        end: formatTimeKey(new Date((item.confirmedStart ?? item.requestedStart).getTime() + item.durationMin * 60 * 1000)),
        status: item.status,
      })),
  };
}

export async function listAdminCustomers(): Promise<AdminCustomerCard[]> {
  const prisma = getPrisma();
  const customers = await prisma.customer.findMany({
    include: customerInclude,
    orderBy: {
      name: 'asc',
    },
  });

  return customers.map(mapCustomer);
}

export async function getAdminCustomerDetail(id: string): Promise<AdminCustomerDetail | null> {
  const prisma = getPrisma();
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: customerInclude,
  });

  return customer ? mapCustomerDetail(customer) : null;
}

function getMonthGridRange(anchorDateKey: string) {
  const anchor = new Date(localDateTimeToUtc(anchorDateKey, '12:00'));
  const firstDayOfMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 12, 0, 0));
  const lastDayOfMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0, 12, 0, 0));
  const firstDayKey = getBratislavaDateKey(firstDayOfMonth);
  const lastDayKey = getBratislavaDateKey(lastDayOfMonth);
  const firstWeekday = firstDayOfMonth.getUTCDay();
  const lastWeekday = lastDayOfMonth.getUTCDay();

  const startKey = shiftDateKey(firstDayKey, firstWeekday === 0 ? -6 : 1 - firstWeekday);
  const endKey = shiftDateKey(lastDayKey, lastWeekday === 0 ? 0 : 7 - lastWeekday);

  return {
    startKey,
    endKey,
    firstDayKey,
    lastDayKey,
  };
}

function buildCalendarDay(reservations: AdminReservationCard[], dateKey: string, isCurrentMonth: boolean): AdminCalendarDay {
  const dayDate = localDateTimeToUtc(dateKey, '12:00');
  const label = formatBratislavaDate(dayDate);
  const dayReservations = reservations.filter((reservation) => reservation.dateLabel === label);

  return {
    dateKey,
    label,
    isCurrentMonth,
    reservations: dayReservations.filter((reservation) => reservation.status === 'CONFIRMED'),
    pending: dayReservations.filter((reservation) => reservation.status === 'PENDING'),
    history: dayReservations.filter((reservation) => reservation.status === 'DONE' || reservation.status === 'CANCELLED'),
  };
}

async function loadCalendarReservations(startKey: string, endKey: string) {
  const prisma = getPrisma();
  const start = startOfBratislavaDayUtc(startKey);
  const end = endOfBratislavaDayUtc(endKey);

  const reservations = await prisma.reservation.findMany({
    include: reservationInclude,
    where: {
      OR: [
        {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          OR: [
            { confirmedStart: { gte: start, lt: end } },
            { requestedStart: { gte: start, lt: end } },
          ],
        },
        {
          status: {
            in: ['DONE', 'CANCELLED'],
          },
          OR: [
            { confirmedStart: { gte: start, lt: end } },
            { requestedStart: { gte: start, lt: end } },
          ],
        },
      ],
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reservations
    .map(mapReservation)
    .filter((reservation) => {
      const startDate = reservation.confirmedStart ? new Date(reservation.confirmedStart) : new Date(reservation.requestedStart);
      const endDate = new Date(startDate.getTime() + reservation.durationMin * 60 * 1000);
      return startDate < end && endDate > start;
    });
}

export async function listAdminCalendarRange(anchorDateKey: string, view: AdminCalendarView): Promise<AdminCalendarData> {
  if (view === 'month') {
    const grid = getMonthGridRange(anchorDateKey);
    const reservations = await loadCalendarReservations(grid.startKey, grid.endKey);
    const anchor = new Date(localDateTimeToUtc(anchorDateKey, '12:00'));
    const firstDayOfMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 12, 0, 0));
    const lastDayOfMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0, 12, 0, 0));
    const firstDayKey = getBratislavaDateKey(firstDayOfMonth);
    const lastDayKey = getBratislavaDateKey(lastDayOfMonth);

    const days: AdminCalendarDay[] = [];
    for (let dateKey = grid.startKey; dateKey <= grid.endKey; dateKey = shiftDateKey(dateKey, 1)) {
      days.push(buildCalendarDay(reservations, dateKey, dateKey >= firstDayKey && dateKey <= lastDayKey));
    }

    return {
      view,
      anchorDateKey,
      titleLabel: getMonthLabel(anchorDateKey),
      rangeLabel: `${formatBratislavaDate(localDateTimeToUtc(grid.startKey, '12:00'))} – ${formatBratislavaDate(localDateTimeToUtc(grid.endKey, '12:00'))}`,
      previousDateKey: shiftMonthKey(anchorDateKey, -1),
      nextDateKey: shiftMonthKey(anchorDateKey, 1),
      days,
    };
  }

  const range = getWeekRange(anchorDateKey);
  const reservations = await loadCalendarReservations(range.startKey, range.endKey);
  const days = Array.from({ length: 5 }, (_, index) => buildCalendarDay(reservations, addDaysToDateKey(range.monday, index), true));

  return {
    view,
    anchorDateKey,
    titleLabel: getWeekRangeLabel(range.monday, range.friday),
    rangeLabel: getWeekRangeLabel(range.monday, range.friday),
    previousDateKey: shiftDateKey(anchorDateKey, -7),
    nextDateKey: shiftDateKey(anchorDateKey, 7),
    days,
  };
}

export async function listAdminCalendarWeek(anchorDateKey: string): Promise<{
  mondayKey: string;
  fridayKey: string;
  days: AdminCalendarDay[];
}> {
  const data = await listAdminCalendarRange(anchorDateKey, 'week');
  return {
    mondayKey: data.days[0]?.dateKey ?? anchorDateKey,
    fridayKey: data.days[data.days.length - 1]?.dateKey ?? anchorDateKey,
    days: data.days,
  };
}

export async function listAdminCalendarMonth(anchorDateKey: string): Promise<AdminCalendarData> {
  return listAdminCalendarRange(anchorDateKey, 'month');
}

export async function getAdminManualReservationContext(): Promise<{
  customers: AdminCustomerCard[];
}> {
  return {
    customers: await listAdminCustomers(),
  };
}
