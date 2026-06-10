import assert from 'node:assert/strict';
import {
  buildDateTimeFromForm,
  fitsSalonHours,
  findReservationCollisions,
} from '../lib/admin-schedule.js';

const existing = [
  {
    id: 'confirmed-1',
    status: 'CONFIRMED',
    start: buildDateTimeFromForm('2026-06-10', '10:00'),
    end: buildDateTimeFromForm('2026-06-10', '11:00'),
    customerName: 'Jana',
    dogName: 'Dunčo',
    phone: '+421 900 111 222',
  },
  {
    id: 'pending-1',
    status: 'PENDING',
    start: buildDateTimeFromForm('2026-06-10', '11:30'),
    end: buildDateTimeFromForm('2026-06-10', '12:00'),
    customerName: 'Mária',
    dogName: 'Blesk',
    phone: '+421 900 333 444',
  },
];

const touching = findReservationCollisions(
  {
    start: buildDateTimeFromForm('2026-06-10', '11:00'),
    end: buildDateTimeFromForm('2026-06-10', '11:30'),
  },
  existing,
);

assert.equal(touching.length, 0, 'touching intervals must not collide');

const overlapping = findReservationCollisions(
  {
    start: buildDateTimeFromForm('2026-06-10', '10:30'),
    end: buildDateTimeFromForm('2026-06-10', '11:15'),
  },
  existing,
);

assert.equal(overlapping.length, 1, 'confirmed overlaps must collide');
assert.equal(overlapping[0].id, 'confirmed-1');

const lunchBlock = fitsSalonHours(
  buildDateTimeFromForm('2026-06-10', '13:00'),
  buildDateTimeFromForm('2026-06-10', '13:30'),
);

assert.equal(lunchBlock, false, 'lunch break is not a bookable slot');

const weekend = fitsSalonHours(
  buildDateTimeFromForm('2026-06-13', '10:00'),
  buildDateTimeFromForm('2026-06-13', '11:00'),
);

assert.equal(weekend, false, 'weekends must remain closed');

console.log('reservation collision assertions passed');
