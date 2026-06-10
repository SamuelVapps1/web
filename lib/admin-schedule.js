export const ADMIN_TIME_WINDOW = {
  start: '10:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  end: '18:00',
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
  const morningStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.start);
  const lunchStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchStart);
  const lunchEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchEnd);
  const dayEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.end);

  const inMorning = startMinutes >= morningStart && endMinutes <= lunchStart;
  const inAfternoon = startMinutes >= lunchEnd && endMinutes <= dayEnd;

  return inMorning || inAfternoon;
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
  const slots = [];
  const morningStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.start);
  const lunchStart = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchStart);
  const lunchEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.lunchEnd);
  const dayEnd = timeKeyToMinutes(ADMIN_TIME_WINDOW.end);

  for (let startMinutes = morningStart; startMinutes < lunchStart; startMinutes += 30) {
    slots.push(minutesToTimeKey(startMinutes));
  }

  for (let startMinutes = lunchEnd; startMinutes < dayEnd; startMinutes += 30) {
    slots.push(minutesToTimeKey(startMinutes));
  }

  return slots;
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
