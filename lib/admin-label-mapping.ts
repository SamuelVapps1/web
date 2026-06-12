const DOG_SIZE_LABELS = {
  SMALL: 'Malý',
  MEDIUM: 'Stredný',
  LARGE: 'Veľký',
} as const;

const RESERVATION_STATUS_LABELS = {
  PENDING: 'Čaká',
  CONFIRMED: 'Potvrdená',
  DONE: 'Dokončená',
  CANCELLED: 'Zrušená',
} as const;

const CUT_TYPE_LABELS = {
  SHORT: 'Krátky strih',
  STANDARD: 'Plný / štandardný strih',
  NO_CUT: 'Úprava bez strihania',
  ADVICE: 'Neviem - poraďte mi',
} as const;

const ADDON_LABELS = {
  BATH: 'Kúpanie',
  NAILS: 'Pazúriky',
  EARS: 'Čistenie uší',
} as const;

export const DOG_SIZE_SELECT_OPTIONS = [
  { value: 'SMALL', label: DOG_SIZE_LABELS.SMALL },
  { value: 'MEDIUM', label: DOG_SIZE_LABELS.MEDIUM },
  { value: 'LARGE', label: DOG_SIZE_LABELS.LARGE },
] as const;

export function getDogSizeLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Neznáma veľkosť';
  }

  return DOG_SIZE_LABELS[value as keyof typeof DOG_SIZE_LABELS] ?? 'Neznáma veľkosť';
}

export function getReservationStatusLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Neznámy stav';
  }

  return RESERVATION_STATUS_LABELS[value as keyof typeof RESERVATION_STATUS_LABELS] ?? 'Neznámy stav';
}

export function getCutTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Neznámy typ strihu';
  }

  return CUT_TYPE_LABELS[value as keyof typeof CUT_TYPE_LABELS] ?? 'Neznámy typ strihu';
}

export function getAddonLabels(serviceIds: string[] | null | undefined): string {
  if (!serviceIds || serviceIds.length === 0) {
    return 'Bez doplnkov';
  }

  const labels = serviceIds
    .map((serviceId) => ADDON_LABELS[serviceId as keyof typeof ADDON_LABELS] ?? serviceId)
    .filter(Boolean);

  return labels.length > 0 ? labels.join(', ') : 'Bez doplnkov';
}
