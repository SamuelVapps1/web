const DOG_SIZE_LABELS = {
  SMALL: 'Malý',
  MEDIUM: 'Stredný',
  LARGE: 'Veľký',
};

const RESERVATION_STATUS_LABELS = {
  PENDING: 'Čaká',
  CONFIRMED: 'Potvrdená',
  DONE: 'Dokončená',
  CANCELLED: 'Zrušená',
};

export function getDogSizeLabel(value) {
  return DOG_SIZE_LABELS[value] ?? 'Neznáma veľkosť';
}

export function getReservationStatusLabel(value) {
  return RESERVATION_STATUS_LABELS[value] ?? 'Neznámy stav';
}
