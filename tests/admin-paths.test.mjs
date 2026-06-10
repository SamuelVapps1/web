import assert from 'node:assert/strict';

import {
  buildAdminLoginRedirectPath,
  isAdminLoginPath,
  isProtectedAdminPath,
} from '../lib/admin-paths.js';

assert.equal(isAdminLoginPath('/admin/login'), true);
assert.equal(isProtectedAdminPath('/admin/login'), false);

assert.equal(isAdminLoginPath('/admin'), false);
assert.equal(isProtectedAdminPath('/admin'), true);

assert.equal(isProtectedAdminPath('/admin/reservations'), true);
assert.equal(isProtectedAdminPath('/admin/customers'), true);

assert.equal(
  buildAdminLoginRedirectPath('/admin/reservations'),
  '/admin/login?next=%2Fadmin%2Freservations'
);

console.log('admin path assertions passed');
