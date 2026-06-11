import assert from 'node:assert/strict';
import { findCustomerMatches, findDuplicateCustomerByPhone } from '../app/admin/(protected)/reservations/new/manual-reservation-helpers.js';

const customers = [
  {
    id: '1',
    name: 'Alena',
    phone: '+421911111111',
    dogs: [{ id: 'd1', name: 'Luna' }],
  },
  {
    id: '2',
    name: 'Marek',
    phone: '+421922222222',
    dogs: [{ id: 'd2', name: 'Rex' }],
  },
];

assert.deepStrictEqual(
  findCustomerMatches(customers, 'rex').map((customer) => customer.id),
  ['2'],
);

assert.equal(findDuplicateCustomerByPhone(customers, '0911 111 111')?.id, '1');

console.log('manual reservation helper assertions passed');
