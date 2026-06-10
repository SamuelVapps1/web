export const TIME_ZONE = 'Europe/Bratislava';

function pad2(value) {
  return value.toString().padStart(2, '0');
}

function parseKeyParts(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return [year, month, day];
}

function parseTimeParts(timeKey) {
  const [hour, minute] = timeKey.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Invalid time key: ${timeKey}`);
  }
  return [hour, minute];
}

function getParts(date, timeZone = TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
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

function getWeekdayName(date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  }).format(date);
}

function getTimeZoneOffsetMinutes(date, timeZone = TIME_ZONE) {
  const parts = getParts(date, timeZone);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (localAsUtc - date.getTime()) / 60000;
}

export function parseDateKey(dateKey) {
  const [year, month, day] = parseKeyParts(dateKey);
  return { year, month, day };
}

export function parseTimeKey(timeKey) {
  const [hour, minute] = parseTimeParts(timeKey);
  return { hour, minute };
}

export function formatDateKey(date) {
  const parts = getParts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function formatTimeKey(date) {
  const parts = getParts(date);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatDateTimeLocalInput(date) {
  const parts = getParts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatBratislavaDate(date) {
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatBratislavaDateTime(date) {
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatBratislavaWeekday(date) {
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    weekday: 'long',
  }).format(date);
}

export function getBratislavaDateKey(date = new Date()) {
  return formatDateKey(date);
}

export function getBratislavaTimeKey(date = new Date()) {
  return formatTimeKey(date);
}

export function getBratislavaWeekdayIndex(date = new Date()) {
  const weekdayName = getWeekdayName(date).toLowerCase();
  switch (weekdayName) {
    case 'monday':
      return 1;
    case 'tuesday':
      return 2;
    case 'wednesday':
      return 3;
    case 'thursday':
      return 4;
    case 'friday':
      return 5;
    case 'saturday':
      return 6;
    default:
      return 0;
  }
}

export function isWeekendDateKey(dateKey) {
  const { year, month, day } = parseDateKey(dateKey);
  const weekday = getBratislavaWeekdayIndex(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  return weekday === 0 || weekday === 6;
}

export function shiftDateKey(dateKey, deltaDays) {
  const { year, month, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, month - 1, day, 12, 0, 0) + deltaDays * 24 * 60 * 60 * 1000);
  return getBratislavaDateKey(shifted);
}

export function startOfBratislavaDayUtc(dateKey) {
  return localDateTimeToUtc(dateKey, '00:00');
}

export function endOfBratislavaDayUtc(dateKey) {
  return startOfBratislavaDayUtc(shiftDateKey(dateKey, 1));
}

export function localDateTimeToUtc(dateKey, timeKey) {
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

export function addDaysToDateKey(dateKey, deltaDays) {
  return shiftDateKey(dateKey, deltaDays);
}

export function isDateKeyBeforeToday(dateKey, todayKey = getBratislavaDateKey()) {
  return dateKey < todayKey;
}

export function isDateKeyToday(dateKey, todayKey = getBratislavaDateKey()) {
  return dateKey === todayKey;
}

export function timeKeyToMinutes(timeKey) {
  const { hour, minute } = parseTimeKey(timeKey);
  return hour * 60 + minute;
}

export function minutesToTimeKey(totalMinutes) {
  const normalized = Math.max(0, totalMinutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}
