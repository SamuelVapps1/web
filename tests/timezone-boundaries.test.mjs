import assert from 'node:assert/strict';

import {
  endOfBratislavaDayUtc,
  formatDateKey,
  getBratislavaDateKey,
  localDateTimeToUtc,
  startOfBratislavaDayUtc,
} from '../lib/time.js';

const summerMorning = localDateTimeToUtc('2026-06-10', '10:00');
assert.equal(summerMorning.toISOString(), '2026-06-10T08:00:00.000Z');

const winterMorning = localDateTimeToUtc('2026-01-10', '10:00');
assert.equal(winterMorning.toISOString(), '2026-01-10T09:00:00.000Z');

assert.equal(getBratislavaDateKey(new Date('2026-06-09T22:30:00.000Z')), '2026-06-10');
assert.equal(getBratislavaDateKey(new Date('2026-01-09T23:30:00.000Z')), '2026-01-10');

assert.equal(startOfBratislavaDayUtc('2026-06-10').toISOString(), '2026-06-09T22:00:00.000Z');
assert.equal(endOfBratislavaDayUtc('2026-06-10').toISOString(), '2026-06-10T22:00:00.000Z');

assert.equal(formatDateKey(new Date('2026-06-10T08:00:00.000Z')), '2026-06-10');

console.log('timezone boundary assertions passed');
