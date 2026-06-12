import { OPENING_HOURS, buildWorkingDaySlots as buildOpeningWorkingDaySlots } from './opening-hours.js';

export const ADMIN_TIME_WINDOW = {
  start: OPENING_HOURS.dayStart,
  lunchStart: OPENING_HOURS.lunchBreak.start,
  lunchEnd: OPENING_HOURS.lunchBreak.end,
  end: OPENING_HOURS.dayEnd,
};

const TIME_ZONE = 'Europe/Bratislava';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}

function parseTimeKey(timeKey) {
  const [hour, minute] = timeKey.split(':').map(Number);
  return { hour, minute };
}

function getParts(date) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function getTimeZoneOffsetMinutes(date) {
  const parts = getParts(date);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (localAsUtc - date.getTime()) / 60000;
}

function formatDateKey(date) {
  const parts = getParts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function formatTimeKey(date) {
  const parts = getParts(date);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

function getBratislavaDateKey(date = new Date()) {
  return formatDateKey(date);
}

function isWeekendDateKey(dateKey) {
  const { year, month, day } = parseDateKey(dateKey);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0))).toLowerCase();

  return weekday === 'saturday' || weekday === 'sunday';
}

function timeKeyToMinutes(timeKey) {
  const { hour, minute } = parseTimeKey(timeKey);
  return hour * 60 + minute;
}

function minutesToTimeKey(totalMinutes) {
  const normalized = Math.max(0, totalMinutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function localDateTimeToUtc(dateKey, timeKey) {
  const { year, month, day } = parseDateKey(dateKey);
  const { hour, minute } = parseTimeKey(timeKey);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  let utcTime = utcGuess;
  for (let index = 0; index < 4; index += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcTime));
    const adjusted = utcGuess - offsetMinutes * 60 * 1000;
    if (adjusted === utcTime) {
      break;
    }
    utcTime = adjusted;
  }

  return new Date(utcTime);
}

export function buildDateTimeFromForm(date, time) {
  return localDateTimeToUtc(date, time);
}

function isWithinWorkingWindow(startMinutes, endMinutes) {
  return OPENING_HOURS.blocks.some((window) => {
    const windowStart = timeKeyToMinutes(window.start);
    const windowEnd = timeKeyToMinutes(window.end);
    return startMinutes >= windowStart && endMinutes <= windowEnd;
  });
}

export function fitsSalonHours(start, end) {
  if (end <= start) {
    return false;
  }

  const startDateKey = getBratislavaDateKey(start);
  if (startDateKey !== getBratislavaDateKey(end)) {
    return false;
  }

  if (isWeekendDateKey(startDateKey)) {
    return false;
  }

  const startMinutes = timeKeyToMinutes(formatTimeKey(start));
  const endMinutes = timeKeyToMinutes(formatTimeKey(end));

  return isWithinWorkingWindow(startMinutes, endMinutes);
}

export function buildWorkingDaySlots() {
  return buildOpeningWorkingDaySlots();
}

export function hasReservationCollision(candidate, reservations) {
  return reservations.some((reservation) => reservation.start < candidate.end && reservation.end > candidate.start);
}

export function findReservationCollisions(candidate, reservations) {
  return reservations
    .filter((reservation) => reservation.status === 'CONFIRMED')
    .filter((reservation) => reservation.start < candidate.end && reservation.end > candidate.start)
    .map((reservation) => ({
      id: reservation.id ?? '',
      customerName: reservation.customerName,
      dogName: reservation.dogName,
      phone: reservation.phone,
      start: formatTimeKey(reservation.start),
      end: formatTimeKey(reservation.end),
      status: reservation.status,
    }));
}

function shiftDateKey(dateKey, deltaDays) {
  const date = new Date(localDateTimeToUtc(dateKey, '12:00'));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return getBratislavaDateKey(date);
}

function roundUpTimeKeyToStep(timeKey, stepMinutes = 30) {
  const roundedMinutes = Math.ceil(timeKeyToMinutes(timeKey) / stepMinutes) * stepMinutes;
  return minutesToTimeKey(roundedMinutes);
}

function getSearchAnchor(startAt) {
  const dateKey = getBratislavaDateKey(startAt);
  const roundedTimeKey = roundUpTimeKeyToStep(formatTimeKey(startAt));

  if (timeKeyToMinutes(roundedTimeKey) >= 24 * 60) {
    return {
      dateKey: shiftDateKey(dateKey, 1),
      timeKey: ADMIN_TIME_WINDOW.start,
    };
  }

  return {
    dateKey,
    timeKey: roundedTimeKey,
  };
}

export function findNextFreeWorkingSlots({ startAt, durationMin, reservations, limit = 6 }) {
  const maxResults = Math.max(0, Math.trunc(limit));

  if (maxResults === 0 || durationMin <= 0) {
    return [];
  }

  const confirmedReservations = reservations.filter((reservation) => reservation.status === 'CONFIRMED');
  const workingSlots = buildWorkingDaySlots();
  const anchor = getSearchAnchor(startAt);
  const results = [];
  let dateKey = anchor.dateKey;
  let guard = 0;

  while (results.length < maxResults && guard < 1826) {
    if (!isWeekendDateKey(dateKey)) {
      for (const timeKey of workingSlots) {
        if (dateKey === anchor.dateKey && timeKeyToMinutes(timeKey) < timeKeyToMinutes(anchor.timeKey)) {
          continue;
        }

        const start = localDateTimeToUtc(dateKey, timeKey);
        const end = new Date(start.getTime() + durationMin * 60 * 1000);

        if (!fitsSalonHours(start, end)) {
          continue;
        }

        if (confirmedReservations.some((reservation) => reservation.start < end && reservation.end > start)) {
          continue;
        }

        results.push({
          dateKey,
          timeKey,
          start,
          end,
        });

        if (results.length >= maxResults) {
          break;
        }
      }
    }

    dateKey = shiftDateKey(dateKey, 1);
    guard += 1;
  }

  return results;
}
