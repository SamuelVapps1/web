import assert from 'node:assert/strict';
import { buildDateTimeFromForm, findNextFreeWorkingSlots } from '../lib/admin-schedule.js';

const slots = findNextFreeWorkingSlots({
  startAt: buildDateTimeFromForm('2026-06-12', '17:20'),
  durationMin: 60,
  reservations: [],
  limit: 5,
});

assert.deepStrictEqual(
  slots.map((slot) => `${slot.dateKey} ${slot.timeKey}`),
  [
    '2026-06-15 10:00',
    '2026-06-15 10:30',
    '2026-06-15 11:00',
    '2026-06-15 11:30',
    '2026-06-15 12:00',
  ],
);

const busySlots = findNextFreeWorkingSlots({
  startAt: buildDateTimeFromForm('2026-06-08', '09:05'),
  durationMin: 60,
  reservations: [
    {
      status: 'CONFIRMED',
      start: buildDateTimeFromForm('2026-06-08', '10:00'),
      end: buildDateTimeFromForm('2026-06-08', '11:00'),
    },
    {
      status: 'CONFIRMED',
      start: buildDateTimeFromForm('2026-06-08', '11:30'),
      end: buildDateTimeFromForm('2026-06-08', '12:30'),
    },
    {
      status: 'CONFIRMED',
      start: buildDateTimeFromForm('2026-06-08', '14:00'),
      end: buildDateTimeFromForm('2026-06-08', '15:00'),
    },
  ],
  limit: 4,
});

assert.deepStrictEqual(
  busySlots.map((slot) => `${slot.dateKey} ${slot.timeKey}`),
  [
    '2026-06-08 15:00',
    '2026-06-08 15:30',
    '2026-06-08 16:00',
    '2026-06-08 16:30',
  ],
);

console.log('next free slot assertions passed');
