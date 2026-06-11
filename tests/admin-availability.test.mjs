import assert from 'node:assert/strict';
import {
  getDailySlotAvailability,
  getLiveAvailability,
  getNextAvailableSlots,
  mapConfirmedAvailabilityReservations,
} from '../lib/admin-availability.js';
import { buildDateTimeFromForm } from '../lib/admin-schedule.js';

const reservations = [
  {
    id: 'confirmed-1',
    status: 'CONFIRMED',
    requestedStart: '2026-06-12T08:00:00.000Z',
    confirmedStart: buildDateTimeFromForm('2026-06-12', '10:00').toISOString(),
    durationMin: 60,
    customerName: 'Jana',
    dogName: 'Luna',
    customerPhone: '+421 900 111 222',
  },
  {
    id: 'pending-1',
    status: 'PENDING',
    requestedStart: buildDateTimeFromForm('2026-06-12', '11:30').toISOString(),
    confirmedStart: null,
    durationMin: 60,
    customerName: 'Marek',
    dogName: 'Rex',
    customerPhone: '+421 900 333 444',
  },
];

const confirmed = mapConfirmedAvailabilityReservations(reservations);

assert.equal(confirmed.length, 1, 'only confirmed reservations should become busy intervals');

const dailySlots = getDailySlotAvailability({
  dateKey: '2026-06-12',
  durationMin: 90,
  reservations: confirmed,
});

assert.equal(
  dailySlots.find((slot) => slot.timeKey === '10:00')?.busy,
  true,
  'slot overlapping a confirmed reservation must be busy',
);
assert.equal(
  dailySlots.find((slot) => slot.timeKey === '11:00')?.busy,
  false,
  'first non-overlapping slot should remain free',
);

const liveAvailability = getLiveAvailability({
  dateKey: '2026-06-12',
  timeKey: '10:30',
  durationMin: 60,
  reservations: confirmed,
});

assert.equal(liveAvailability.isFree, false, 'live availability should report collisions');
assert.equal(liveAvailability.collisions[0]?.dogName, 'Luna');

const nextSlots = getNextAvailableSlots({
  startAt: buildDateTimeFromForm('2026-06-12', '09:10'),
  durationMin: 60,
  reservations: confirmed,
  limit: 3,
});

assert.deepStrictEqual(
  nextSlots.map((slot) => `${slot.dateKey} ${slot.timeKey}`),
  ['2026-06-12 11:00', '2026-06-12 11:30', '2026-06-12 12:00'],
);

console.log('admin availability assertions passed');
