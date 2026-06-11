export const SLOVAK_PHONE_E164_PATTERN = /^\+421\d{9}$/;

const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type BookingContactField = 'customerName' | 'customerPhone' | 'customerEmail';

export type BookingContactFieldErrors = Partial<Record<BookingContactField, string>>;

function normalizeText(value: FormDataEntryValue | string | number | null | undefined): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value).trim();
  }

  return '';
}

export function normalizeSlovakPhone(value: FormDataEntryValue | string | number | null | undefined): string {
  const raw = normalizeText(value);
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('421')) {
    return `+${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+421${digits.slice(1)}`;
  }

  return '';
}

export function isValidSlovakPhone(value: string): boolean {
  return SLOVAK_PHONE_E164_PATTERN.test(value);
}

export function validateBookingContactFields(input: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}): {
  fieldErrors: BookingContactFieldErrors;
  normalizedPhone: string;
} {
  const fieldErrors: BookingContactFieldErrors = {};
  const normalizedPhone = normalizeSlovakPhone(input.customerPhone);
  const trimmedName = input.customerName.trim();
  const trimmedPhone = input.customerPhone.trim();
  const trimmedEmail = input.customerEmail.trim();

  if (!trimmedName) {
    fieldErrors.customerName = 'Zadajte meno.';
  }

  if (!trimmedPhone) {
    fieldErrors.customerPhone = 'Zadajte telefónne číslo.';
  } else if (!normalizedPhone || !isValidSlovakPhone(normalizedPhone)) {
    fieldErrors.customerPhone =
      'Skontrolujte telefónne číslo — napríklad 0911 925 373 alebo +421 911 925 373.';
  }

  if (trimmedEmail && !CONTACT_EMAIL_PATTERN.test(trimmedEmail)) {
    fieldErrors.customerEmail = 'Skontrolujte formát emailu.';
  }

  return {
    fieldErrors,
    normalizedPhone,
  };
}
