export const TIME_ZONE = 'Europe/Bratislava';

export type LocalDateKey = `${number}-${number}-${number}`;
export type LocalTimeKey = `${number}:${number}`;

type TimeZoneParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function parseKeyParts(dateKey: string): [number, number, number] {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  return [year, month, day];
}

function parseTimeParts(timeKey: string): [number, number] {
  const [hour, minute] = timeKey.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Invalid time key: ${timeKey}`);
  }
  return [hour, minute];
}

function getParts(date: Date, timeZone: string = TIME_ZONE): TimeZoneParts {
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

function getWeekdayName(date: Date, timeZone: string = TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  }).format(date);
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string = TIME_ZONE): number {
  const parts = getParts(date, timeZone);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (localAsUtc - date.getTime()) / 60000;
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = parseKeyParts(dateKey);
  return { year, month, day };
}

export function parseTimeKey(timeKey: string): { hour: number; minute: number } {
  const [hour, minute] = parseTimeParts(timeKey);
  return { hour, minute };
}

export function formatDateKey(date: Date): LocalDateKey {
  const parts = getParts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}` as LocalDateKey;
}

export function formatTimeKey(date: Date): LocalTimeKey {
  const parts = getParts(date);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}` as LocalTimeKey;
}

export function formatDateTimeLocalInput(date: Date): string {
  const parts = getParts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatBratislavaDate(date: Date): string {
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatBratislavaDateTime(date: Date): string {
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

export function formatBratislavaWeekday(date: Date): string {
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: TIME_ZONE,
    weekday: 'long',
  }).format(date);
}

export function getBratislavaDateKey(date: Date = new Date()): LocalDateKey {
  return formatDateKey(date);
}

export function getBratislavaTimeKey(date: Date = new Date()): LocalTimeKey {
  return formatTimeKey(date);
}

export function getBratislavaWeekdayIndex(date: Date = new Date()): number {
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

export function isWeekendDateKey(dateKey: string): boolean {
  const { year, month, day } = parseDateKey(dateKey);
  const weekday = getBratislavaWeekdayIndex(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  return weekday === 0 || weekday === 6;
}

export function shiftDateKey(dateKey: string, deltaDays: number): LocalDateKey {
  const { year, month, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, month - 1, day, 12, 0, 0) + deltaDays * 24 * 60 * 60 * 1000);
  return getBratislavaDateKey(shifted);
}

export function startOfBratislavaDayUtc(dateKey: string): Date {
  return localDateTimeToUtc(dateKey, '00:00');
}

export function endOfBratislavaDayUtc(dateKey: string): Date {
  return startOfBratislavaDayUtc(shiftDateKey(dateKey, 1));
}

export function localDateTimeToUtc(dateKey: string, timeKey: string): Date {
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

export function addDaysToDateKey(dateKey: string, deltaDays: number): LocalDateKey {
  return shiftDateKey(dateKey, deltaDays);
}

export function isDateKeyBeforeToday(dateKey: string, todayKey: string = getBratislavaDateKey()): boolean {
  return dateKey < todayKey;
}

export function isDateKeyToday(dateKey: string, todayKey: string = getBratislavaDateKey()): boolean {
  return dateKey === todayKey;
}

export function timeKeyToMinutes(timeKey: string): number {
  const { hour, minute } = parseTimeKey(timeKey);
  return hour * 60 + minute;
}

export function minutesToTimeKey(totalMinutes: number): LocalTimeKey {
  const normalized = Math.max(0, totalMinutes);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${pad2(hour)}:${pad2(minute)}` as LocalTimeKey;
}

