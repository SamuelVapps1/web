'use client';

import { useMemo } from 'react';
import styles from '../../../admin.module.css';
import { getBratislavaDateKey } from '@/lib/time';
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

  return (
    <>
      <div className={styles.freeSlotsPanel}>
        <div className={styles.freeSlotsHeader}>
          <div>
            <p className={styles.sectionKicker}>Najbližšie voľné termíny</p>
            <p className={styles.fieldHint}>Klikni na termín a predvyplní sa dátum aj čas.</p>
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

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Dátum</label>
          <input
            type="date"
            min={getBratislavaDateKey()}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Čas</label>
          <input
            type="time"
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
          />
        </div>
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

      <div className={styles.availabilitySummary}>
        <div className={styles.slotGrid} role="radiogroup" aria-label="Obsadené sloty dňa">
          {dailySlots.map((slot) => {
            const active = time === slot.timeKey;

            return (
              <button
                key={slot.timeKey}
                type="button"
                className={`${styles.slotButton} ${slot.busy ? styles.slotButtonBusy : ''} ${active ? styles.slotButtonActive : ''}`}
                onClick={() => onTimeChange(slot.timeKey)}
              >
                <span className={styles.slotButtonTime}>{slot.timeKey}</span>
                <span className={styles.slotButtonState}>{slot.busy ? 'obsadené' : 'voľné'}</span>
              </button>
            );
          })}
        </div>

        {liveAvailability.isFree ? (
          <p className={styles.availabilityFree}>Termín je voľný.</p>
        ) : (
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
        )}
      </div>
    </>
  );
}
