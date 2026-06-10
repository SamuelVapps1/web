import 'server-only';

import type { ReservationStatus, Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { addDaysToDateKey, endOfBratislavaDayUtc, formatBratislavaDate, formatBratislavaDateTime, formatDateKey, formatTimeKey, getBratislavaDateKey, localDateTimeToUtc, startOfBratislavaDayUtc } from '@/lib/time';
import { getAddonLabels, getCutTypeLabel, getDogSizeLabel, getEffectiveReservationEnd, getEffectiveReservationStart, type AdminReservationTab } from '@/lib/admin-domain';

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
  customerNote: string | null;
  dogId: string;
  dogName: string;
  dogBreed: string | null;
  dogSize: string;
  dogSizeLabel: string;
  dogTemperamentNote: string | null;
  dogHealthNote: string | null;
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
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    size: string;
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
  createdAt: string;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    size: string;
    temperamentNote: string | null;
    healthNote: string | null;
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

function mapReservation(record: ReservationRelation): AdminReservationCard {
  const effectiveStart = getEffectiveReservationStart(record.requestedStart, record.confirmedStart);
  const effectiveEnd = getEffectiveReservationEnd(record.requestedStart, record.confirmedStart, record.durationMin);

  return {
    id: record.id,
    status: record.status,
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
    customerNote: record.dog.customer.note,
    dogId: record.dog.id,
    dogName: record.dog.name,
    dogBreed: record.dog.breed,
    dogSize: record.dog.size,
    dogSizeLabel: getDogSizeLabel(record.dog.size),
    dogTemperamentNote: record.dog.temperamentNote,
    dogHealthNote: record.dog.healthNote,
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
    dogs: record.dogs.map((dog) => ({
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      size: dog.size,
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
      temperamentNote: dog.temperamentNote,
      healthNote: dog.healthNote,
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

function getWeekRange(anchorDateKey: string) {
  const monday = (() => {
    const date = new Date(localDateTimeToUtc(anchorDateKey, '12:00'));
    const day = date.getUTCDay();
    const delta = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + delta);
    return formatDateKey(date);
  })();

  const friday = addDaysToDateKey(monday, 4);
  return {
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
  const reservations = await prisma.reservation.findMany({
    include: reservationInclude,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const mapped = reservations.map(mapReservation);

  if (tab === 'pending') {
    return mapped.filter((reservation) => reservation.status === 'PENDING');
  }

  if (tab === 'confirmed') {
    return mapped
      .filter((reservation) => reservation.status === 'CONFIRMED')
      .sort((left, right) => new Date(left.confirmedStart ?? left.requestedStart).getTime() - new Date(right.confirmedStart ?? right.requestedStart).getTime());
  }

  return mapped
    .filter((reservation) => reservation.status === 'DONE' || reservation.status === 'CANCELLED')
    .sort((left, right) => new Date(right.confirmedStart ?? right.requestedStart).getTime() - new Date(left.confirmedStart ?? left.requestedStart).getTime());
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

export async function listAdminCalendarWeek(anchorDateKey: string): Promise<{
  mondayKey: string;
  fridayKey: string;
  days: {
    dateKey: string;
    label: string;
    reservations: AdminReservationCard[];
    pending: AdminReservationCard[];
  }[];
}> {
  const prisma = getPrisma();
  const range = getWeekRange(anchorDateKey);
  const reservations = await prisma.reservation.findMany({
    include: reservationInclude,
    where: {
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const mapped = reservations
    .map(mapReservation)
    .filter((reservation) => {
      const start = reservation.confirmedStart ? new Date(reservation.confirmedStart) : new Date(reservation.requestedStart);
      const end = new Date(start.getTime() + reservation.durationMin * 60 * 1000);
      return start < range.end && end > range.start;
    });

  const days = Array.from({ length: 5 }, (_, index) => {
    const dateKey = addDaysToDateKey(range.monday, index);
    const dayReservations = mapped.filter((reservation) => reservation.dateLabel === formatBratislavaDate(localDateTimeToUtc(dateKey, '12:00')));
    return {
      dateKey,
      label: formatBratislavaDate(localDateTimeToUtc(dateKey, '12:00')),
      reservations: dayReservations.filter((reservation) => reservation.status === 'CONFIRMED'),
      pending: dayReservations.filter((reservation) => reservation.status === 'PENDING'),
    };
  });

  return {
    mondayKey: range.monday,
    fridayKey: range.friday,
    days,
  };
}

export type ManualReservationCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    size: string;
    temperamentNote: string | null;
    healthNote: string | null;
  }[];
};

export async function getAdminManualReservationContext(): Promise<{
  customers: ManualReservationCustomer[];
}> {
  const prisma = getPrisma();
  const customers = await prisma.customer.findMany({
    include: {
      dogs: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return {
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      note: customer.note,
      dogs: customer.dogs.map((dog) => ({
        id: dog.id,
        name: dog.name,
        breed: dog.breed,
        size: dog.size,
        temperamentNote: dog.temperamentNote,
        healthNote: dog.healthNote,
      })),
    })),
  };
}
