import assert from 'node:assert/strict';
import { getDogSizeLabel, getReservationStatusLabel } from '../lib/admin-labels.js';

assert.equal(getDogSizeLabel('SMALL'), 'Malý');
assert.equal(getDogSizeLabel('MEDIUM'), 'Stredný');
assert.equal(getDogSizeLabel('LARGE'), 'Veľký');
assert.equal(getDogSizeLabel('UNKNOWN'), 'Neznáma veľkosť');

assert.equal(getReservationStatusLabel('PENDING'), 'Čaká');
assert.equal(getReservationStatusLabel('CONFIRMED'), 'Potvrdená');
assert.equal(getReservationStatusLabel('DONE'), 'Dokončená');
assert.equal(getReservationStatusLabel('CANCELLED'), 'Zrušená');
assert.equal(getReservationStatusLabel('UNKNOWN'), 'Neznámy stav');

console.log('admin label assertions passed');
