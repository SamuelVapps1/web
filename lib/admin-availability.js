import {
  buildDateTimeFromForm,
  buildWorkingDaySlots,
  findNextFreeWorkingSlots,
  findReservationCollisions,
} from './admin-schedule.js';

function capitalizeFirstLetter(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

const slotLabelFormatter = new Intl.DateTimeFormat('sk-SK', {
  timeZone: 'Europe/Bratislava',
  weekday: 'long',
  day: 'numeric',
  month: 'numeric',
});

export function mapConfirmedAvailabilityReservations(reservations) {
  return reservations
    .filter((item) => item?.status === 'CONFIRMED')
    .map((item) => {
      const startIso = item.confirmedStart ?? item.requestedStart;
      const start = new Date(startIso);
      const end = new Date(start.getTime() + item.durationMin * 60 * 1000);

      return {
        id: item.id,
        status: item.status,
        customerName: item.customerName,
        dogName: item.dogName,
        phone: item.customerPhone,
        start,
        end,
      };
    });
}

export function getAvailabilityCandidate(dateKey, timeKey, durationMin) {
  const start = buildDateTimeFromForm(dateKey, timeKey);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return { start, end };
}

export function getDailySlotAvailability({ dateKey, durationMin, reservations }) {
  return buildWorkingDaySlots().map((timeKey) => {
    const candidate = getAvailabilityCandidate(dateKey, timeKey, durationMin);
    const collisions = findReservationCollisions(candidate, reservations);

    return {
      timeKey,
      collisions,
      busy: collisions.length > 0,
    };
  });
}

export function getLiveAvailability({ dateKey, timeKey, durationMin, reservations }) {
  const candidate = getAvailabilityCandidate(dateKey, timeKey, durationMin);
  const collisions = findReservationCollisions(candidate, reservations);

  return {
    candidate,
    collisions,
    isFree: collisions.length === 0,
  };
}

export function getNextAvailableSlots({ startAt, durationMin, reservations, limit = 6 }) {
  return findNextFreeWorkingSlots({
    startAt,
    durationMin,
    reservations,
    limit,
  });
}

export function formatAvailabilitySlotLabel(date, timeKey) {
  return `${capitalizeFirstLetter(slotLabelFormatter.format(date))} · ${timeKey}`;
}
