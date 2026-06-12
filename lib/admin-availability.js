import {
  buildDateTimeFromForm,
  findNextFreeWorkingSlots,
  findReservationCollisions,
} from './admin-schedule.js';
import { buildCalendarDaySlots, isLunchBreakSlot } from './opening-hours.js';

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
  return buildCalendarDaySlots().map((timeKey) => {
    if (isLunchBreakSlot(timeKey)) {
      return {
        timeKey,
        collisions: [],
        busy: true,
        blockedLabel: 'Obed',
        isLunchBreak: true,
      };
    }

    const candidate = getAvailabilityCandidate(dateKey, timeKey, durationMin);
    const collisions = findReservationCollisions(candidate, reservations);

    return {
      timeKey,
      collisions,
      busy: collisions.length > 0,
      blockedLabel: null,
      isLunchBreak: false,
    };
  });
}

export function getLiveAvailability({ dateKey, timeKey, durationMin, reservations }) {
  if (isLunchBreakSlot(timeKey)) {
    const candidate = getAvailabilityCandidate(dateKey, timeKey, durationMin);

    return {
      candidate,
      collisions: [],
      isFree: false,
      blockedLabel: 'Obed',
      isLunchBreak: true,
    };
  }

  const candidate = getAvailabilityCandidate(dateKey, timeKey, durationMin);
  const collisions = findReservationCollisions(candidate, reservations);

  return {
    candidate,
    collisions,
    isFree: collisions.length === 0,
    blockedLabel: null,
    isLunchBreak: false,
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
