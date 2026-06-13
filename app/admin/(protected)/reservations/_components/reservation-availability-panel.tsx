'use client';

import { useEffect, useMemo, useRef } from 'react';
import styles from '../../../admin.module.css';
import { getBratislavaDateKey, shiftDateKey } from '@/lib/time';
import {
  formatAvailabilitySlotLabel,
  getDailySlotAvailability,
  getLiveAvailability,
  getNextAvailableSlots,
  mapConfirmedAvailabilityReservations,
  type RawAvailabilityReservation,
} from '@/lib/admin-availability.js';

const DEFAULT_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240];

type ReservationAvailabilityPanelProps = {
  reservations: RawAvailabilityReservation[];
  date: string;
  time: string;
  durationMin: number;
  availabilityCursor: Date;
  expanded?: boolean;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onAvailabilityCursorChange: (value: Date) => void;
  durationOptions?: number[];
};

export default function ReservationAvailabilityPanel({
  reservations,
  date,
  time,
  durationMin,
  availabilityCursor,
  expanded = true,
  onDateChange,
  onTimeChange,
  onDurationChange,
  onAvailabilityCursorChange,
  durationOptions = DEFAULT_DURATION_OPTIONS,
}: ReservationAvailabilityPanelProps) {
  const confirmedReservations = useMemo(
    () => mapConfirmedAvailabilityReservations(reservations),
    [reservations],
  );
  const timeSectionRef = useRef<HTMLDivElement | null>(null);
  const previousDateRef = useRef(date);
  const todayKey = getBratislavaDateKey();

  const dayStripFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('sk-SK', {
        timeZone: 'Europe/Bratislava',
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      }),
    [],
  );

  const selectedDayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('sk-SK', {
        timeZone: 'Europe/Bratislava',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    [],
  );

  const dayOptions = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const dateKey = shiftDateKey(todayKey, index);
      const candidateSlots = getDailySlotAvailability({
        dateKey,
        durationMin,
        reservations: confirmedReservations,
      });
      const occupiedCount = candidateSlots.filter((slot) => slot.busy && !slot.isLunchBreak).length;

      return {
        dateKey,
        label: dayStripFormatter.format(new Date(`${dateKey}T12:00:00Z`)),
        occupiedCount,
        selected: date === dateKey,
      };
    });
  }, [confirmedReservations, date, dayStripFormatter, durationMin, todayKey]);

  const nextFreeSlots = useMemo(
    () =>
      getNextAvailableSlots({
        startAt: availabilityCursor,
        durationMin,
        reservations: confirmedReservations,
        limit: 6,
      }),
    [availabilityCursor, confirmedReservations, durationMin],
  );

  const dailySlots = useMemo(
    () =>
      getDailySlotAvailability({
        dateKey: date,
        durationMin,
        reservations: confirmedReservations,
      }),
    [confirmedReservations, date, durationMin],
  );

  const liveAvailability = useMemo(
    () =>
      getLiveAvailability({
        dateKey: date,
        timeKey: time,
        durationMin,
        reservations: confirmedReservations,
      }),
    [confirmedReservations, date, durationMin, time],
  );

  useEffect(() => {
    if (!expanded || previousDateRef.current === date) {
      previousDateRef.current = date;
      return;
    }

    previousDateRef.current = date;
    timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [date, expanded]);

  return (
    <div className={styles.freeSlotsPanel}>
      <div className={styles.freeSlotsHeader}>
        <div>
          <p className={styles.sectionKicker}>Vyber deň</p>
          <p className={styles.fieldHint}>Najprv klikni na deň, potom na čas v tom dni.</p>
        </div>
      </div>

      <div className={styles.dayMiniCalendar}>
        {dayOptions.map((day) => (
          <button
            key={day.dateKey}
            type="button"
            className={`${styles.dayMiniButton} ${day.selected ? styles.dayMiniButtonSelected : ''}`}
            aria-pressed={day.selected}
            onClick={() => onDateChange(day.dateKey)}
          >
            <span className={styles.dayMiniButtonLabel}>{day.label}</span>
            <span className={styles.dayMiniButtonMeta}>
              {day.occupiedCount > 0 ? `${day.occupiedCount} obsadených` : 'Voľný deň'}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.availabilityStatus}>
        <p className={styles.availabilityNote}>
          {date ? selectedDayFormatter.format(new Date(`${date}T12:00:00Z`)) : 'Vyber deň z kalendára vyššie.'}
        </p>
      </div>

      {expanded ? (
        <div ref={timeSectionRef} className={styles.availabilityDayPanel}>
          <div className={styles.freeSlotsHeader}>
            <div>
              <p className={styles.sectionKicker}>Časy v dni</p>
              <p className={styles.fieldHint}>Klikni na čas a vyplní sa dole termín.</p>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                const lastSlot = nextFreeSlots[nextFreeSlots.length - 1];
                if (!lastSlot) {
                  return;
                }

                onAvailabilityCursorChange(new Date(lastSlot.end.getTime() + 30 * 60 * 1000));
              }}
            >
              Ďalšie termíny
            </button>
          </div>

          <div className={styles.availabilityStatus}>
            {liveAvailability.blockedLabel ? (
              <p className={styles.availabilityLunch}>Obed 13:00 – 14:00</p>
            ) : liveAvailability.collisions.length > 0 ? (
              <div className={styles.availabilityBanner}>
                <p className={styles.availabilityTitle}>Koliduje s:</p>
                <div className={styles.collisionList}>
                  {liveAvailability.collisions.map((collision) => (
                    <div key={collision.id} className={styles.collisionItem}>
                      <span>
                        {collision.start} · {collision.dogName} · {collision.phone}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.slotGrid} role="radiogroup" aria-label="Obsadené sloty dňa">
            {dailySlots.map((slot) => {
              const active = time === slot.timeKey;
              const stateLabel = slot.blockedLabel ?? (slot.busy ? 'obsadené' : 'voľné');

              return (
                <button
                  key={slot.timeKey}
                  type="button"
                  className={`${styles.slotButton} ${slot.isLunchBreak ? styles.slotButtonLunch : ''} ${slot.busy ? styles.slotButtonBusy : ''} ${active ? styles.slotButtonActive : ''}`}
                  onClick={() => onTimeChange(slot.timeKey)}
                >
                  <span className={styles.slotButtonTime}>{slot.timeKey}</span>
                  <span className={styles.slotButtonState}>{stateLabel}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.durationPanel}>
            <div className={styles.field}>
              <label>Trvanie</label>
              <select
                value={durationMin}
                onChange={(event) => onDurationChange(Number(event.target.value))}
              >
                {durationOptions.map((value) => (
                  <option key={value} value={value}>
                    {value} min
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.availabilitySummary}>
        <div className={styles.freeSlotsPanel}>
          <div className={styles.freeSlotsHeader}>
            <div>
              <p className={styles.sectionKicker}>Najbližšie voľné termíny</p>
              <p className={styles.fieldHint}>Klikni na termín a nastaví sa deň aj čas.</p>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                const lastSlot = nextFreeSlots[nextFreeSlots.length - 1];
                if (!lastSlot) {
                  return;
                }

                onAvailabilityCursorChange(new Date(lastSlot.end.getTime() + 30 * 60 * 1000));
              }}
            >
              Ďalšie termíny
            </button>
          </div>

          <div className={styles.freeSlotsGrid}>
            {nextFreeSlots.map((slot) => {
              const selected = date === slot.dateKey && time === slot.timeKey;

              return (
                <button
                  key={`${slot.dateKey}-${slot.timeKey}`}
                  type="button"
                  className={`${styles.freeSlotChip} ${selected ? styles.freeSlotChipSelected : ''}`}
                  aria-pressed={selected}
                  onClick={() => {
                    onDateChange(slot.dateKey);
                    onTimeChange(slot.timeKey);
                  }}
                >
                  <span className={styles.freeSlotChipLabel}>
                    {formatAvailabilitySlotLabel(slot.start, slot.timeKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
