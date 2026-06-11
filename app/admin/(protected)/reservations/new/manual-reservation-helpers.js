function compactPhoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizePhoneLookup(value) {
  const digits = compactPhoneDigits(value);

  if (digits.startsWith('421') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `421${digits.slice(1)}`;
  }

  return digits;
}

function normalizeQuery(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function findCustomerMatches(customers, query) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return customers;
  }

  return customers.filter((customer) => {
    const haystack = [
      customer.name,
      customer.phone,
      ...(customer.dogs ?? []).map((dog) => dog.name),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function findDuplicateCustomerByPhone(customers, phone) {
  const normalizedPhone = normalizePhoneLookup(phone);

  if (!normalizedPhone) {
    return null;
  }

  return (
    customers.find((customer) => normalizePhoneLookup(customer.phone) === normalizedPhone) ?? null
  );
}
