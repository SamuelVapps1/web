const SLOT_STEP_MINUTES = 30;

const DAY_START = '10:00';
const LUNCH_BREAK_START = '13:00';
const LUNCH_BREAK_END = '14:00';
const DAY_END = '18:00';

const OPEN_WINDOWS = [
  { start: DAY_START, end: LUNCH_BREAK_START },
  { start: LUNCH_BREAK_END, end: DAY_END },
];

function pad2(value) {
  return String(value).padStart(2, '0');
}

function timeKeyToMinutes(timeKey) {
  const [hour, minute] = timeKey.split(':').map(Number);
  return hour * 60 + minute;
}

function minutesToTimeKey(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function buildSlotSequence(start, end, stepMinutes = SLOT_STEP_MINUTES) {
  const slots = [];
  const startMinutes = timeKeyToMinutes(start);
  const endMinutes = timeKeyToMinutes(end);

  for (let current = startMinutes; current + stepMinutes <= endMinutes; current += stepMinutes) {
    slots.push(minutesToTimeKey(current));
  }

  return slots;
}

export const OPENING_HOURS = Object.freeze({
  workdays: [1, 2, 3, 4, 5],
  blocks: OPEN_WINDOWS,
  lunchBreak: {
    start: LUNCH_BREAK_START,
    end: LUNCH_BREAK_END,
  },
  dayStart: DAY_START,
  dayEnd: DAY_END,
  slotStepMinutes: SLOT_STEP_MINUTES,
});

export function buildWorkingDaySlots() {
  return OPEN_WINDOWS.flatMap((window) => buildSlotSequence(window.start, window.end));
}

export function buildCalendarDaySlots() {
  return buildSlotSequence(DAY_START, DAY_END);
}

export function buildLunchBreakSlots() {
  return buildSlotSequence(LUNCH_BREAK_START, LUNCH_BREAK_END);
}

export function isLunchBreakSlot(timeKey) {
  return timeKey >= LUNCH_BREAK_START && timeKey < LUNCH_BREAK_END;
}

