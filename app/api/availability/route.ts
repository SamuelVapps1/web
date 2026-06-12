import { getPrisma } from '@/lib/prisma';
import { formatDateKey, formatTimeKey, isWeekendDateKey, localDateTimeToUtc } from '@/lib/time';
import { OPENING_HOURS } from '@/lib/opening-hours.js';

export const revalidate = 60;

function isDateKey(value: string | null): value is `${number}-${number}-${number}` {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!isDateKey(from) || !isDateKey(to) || from > to) {
    return Response.json({ error: 'Neplatný rozsah dátumov.' }, { status: 400 });
  }

  const rangeStart = localDateTimeToUtc(from, '00:00');
  const rangeEnd = localDateTimeToUtc(to, '23:59');

  const prisma = getPrisma();
  const reservations = await prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      OR: [{ requestedStart: { lt: rangeEnd } }, { confirmedStart: { lt: rangeEnd } }],
    },
    select: {
      confirmedStart: true,
      requestedStart: true,
      durationMin: true,
    },
    orderBy: {
      requestedStart: 'asc',
    },
  });

  const intervals = reservations
    .map((reservation) => {
      const start = reservation.confirmedStart ?? reservation.requestedStart;
      const end = new Date(start.getTime() + reservation.durationMin * 60 * 1000);

      return {
        date: formatDateKey(start),
        start: formatTimeKey(start),
        end: formatTimeKey(end),
        startUtc: start,
        endUtc: end,
      };
    })
    .filter((interval) => interval.startUtc < rangeEnd && interval.endUtc > rangeStart)
    .map(({ date, start, end }) => ({ date, start, end }));

  const lunchIntervals = [];
  for (let current = new Date(rangeStart); current <= rangeEnd; current.setUTCDate(current.getUTCDate() + 1)) {
    const dateKey = formatDateKey(current);
    if (isWeekendDateKey(dateKey)) {
      continue;
    }

    const lunchStart = localDateTimeToUtc(dateKey, OPENING_HOURS.lunchBreak.start);
    const lunchEnd = new Date(lunchStart.getTime() + OPENING_HOURS.slotStepMinutes * 60 * 1000);
    lunchIntervals.push({
      date: dateKey,
      start: formatTimeKey(lunchStart),
      end: formatTimeKey(lunchEnd),
    });
  }

  return Response.json([...intervals, ...lunchIntervals], {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
    },
  });
}
