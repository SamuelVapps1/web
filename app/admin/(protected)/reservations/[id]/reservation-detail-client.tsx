'use client';

import { useActionState, useMemo, useState } from 'react';
import styles from '../../../admin.module.css';
import {
  cancelReservation,
  completeReservation,
  confirmReservation,
  declineReservation,
  updateReservation,
  type AdminActionState,
} from '@/app/admin/actions';
import { buildWorkingDaySlots, findNextFreeWorkingSlots, findReservationCollisions } from '@/lib/admin-schedule.js';
import { getBratislavaDateKey, localDateTimeToUtc } from '@/lib/time';
import { getCustomerTagSummary, getDefaultDurationForSize } from '@/lib/admin-domain';

const initialState: AdminActionState = { kind: 'idle' };
type ReservationAction = (stateOrFormData: AdminActionState | FormData, maybeFormData?: FormData) => Promise<AdminActionState>;

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts;
}

function toTimeInputValue(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bratislava',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

const freeSlotLabelFormatter = new Intl.DateTimeFormat('sk-SK', {
  timeZone: 'Europe/Bratislava',
  weekday: 'long',
  day: 'numeric',
  month: 'numeric',
});

function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFreeSlotLabel(date: Date, timeKey: string): string {
  return `${capitalizeFirstLetter(freeSlotLabelFormatter.format(date))} · ${timeKey}`;
}

function toReservationDateTime(dateKey: string, timeKey: string, durationMin: number) {
  const start = localDateTimeToUtc(dateKey, timeKey);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  return { start, end };
}

function StateBanner({ state }: { state: AdminActionState }) {
  if (state.kind === 'idle') {
    return null;
  }

  return (
    <div className={`${styles.stateBanner} ${state.kind === 'error' ? styles.stateBannerError : state.kind === 'warning' ? styles.stateBannerWarning : styles.stateBannerSuccess}`}>
      <p className={styles.stateBannerTitle}>
        {state.kind === 'error' ? 'Nepodarilo sa uložiť' : state.kind === 'warning' ? 'Uložené s upozornením' : 'Uložené'}
      </p>
      <p>{state.message}</p>
      {state.kind === 'warning' && state.collisions.length > 0 ? (
        <ul className={styles.stateCollisionList}>
          {state.collisions.map((collision) => (
            <li key={collision.id}>
              {collision.start} - {collision.end} · {collision.customerName} / {collision.dogName} · {collision.phone}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ReservationTimingForm({
  reservation,
  action,
  submitLabel,
}: {
  reservation: {
    id: string;
    startIso: string;
    durationMin: number;
    internalNote: string | null;
    nowIso: string;
    availabilityReservations: {
      id: string;
      status: string;
      statusLabel: string;
      requestedStart: string;
      confirmedStart: string | null;
      durationMin: number;
      customerName: string;
      dogName: string;
      customerPhone: string;
    }[];
  };
  action: ReservationAction;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(reservation.startIso));
  const [selectedTime, setSelectedTime] = useState(() => toTimeInputValue(reservation.startIso));
  const [selectedDuration, setSelectedDuration] = useState(reservation.durationMin);
  const [availabilityCursor, setAvailabilityCursor] = useState(() => new Date(reservation.nowIso));
  const durationOptions = useMemo(() => Array.from({ length: 8 }, (_, index) => (index + 1) * 30), []);
  const workingSlots = useMemo(() => buildWorkingDaySlots(), []);

  const confirmedReservations = useMemo(
    () =>
      reservation.availabilityReservations.map((item) => {
        const startIso = item.confirmedStart ?? item.requestedStart;
        const start = new Date(startIso);
        const end = new Date(start.getTime() + item.durationMin * 60 * 1000);

        return {
          id: item.id,
          status: item.status as 'PENDING' | 'CONFIRMED' | 'DONE' | 'CANCELLED',
          customerName: item.customerName,
          dogName: item.dogName,
          phone: item.customerPhone,
          start,
          end,
        };
      }),
    [reservation.availabilityReservations],
  );

  const selectedWindow = useMemo(
    () => toReservationDateTime(selectedDate, selectedTime, selectedDuration),
    [selectedDate, selectedTime, selectedDuration],
  );

  const selectedCollisions = useMemo(
    () => findReservationCollisions(selectedWindow, confirmedReservations),
    [confirmedReservations, selectedWindow],
  );

  const nextFreeSlots = useMemo(
    () =>
      findNextFreeWorkingSlots({
        startAt: availabilityCursor,
        durationMin: selectedDuration,
        reservations: confirmedReservations,
        limit: 6,
      }),
    [availabilityCursor, confirmedReservations, selectedDuration],
  );

  const slotBusyMap = useMemo(() => {
    const entries = workingSlots.map((slot) => {
      const candidate = toReservationDateTime(selectedDate, slot, 30);
      return [slot, findReservationCollisions(candidate, confirmedReservations).length > 0] as const;
    });

    return Object.fromEntries(entries) as Record<string, boolean>;
  }, [confirmedReservations, selectedDate, workingSlots]);

  return (
    <section className={styles.detailCard}>
      <StateBanner state={state} />
      <form action={formAction} className={styles.formGrid}>
        <input type="hidden" name="id" value={reservation.id} />
        <input type="hidden" name="date" value={selectedDate} />
        <input type="hidden" name="time" value={selectedTime} />
        <input type="hidden" name="durationMin" value={selectedDuration} />
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <div className={styles.freeSlotsPanel}>
            <div className={styles.freeSlotsHeader}>
              <div>
                <p className={styles.sectionKicker}>Najbližšie voľné termíny</p>
                <p className={styles.fieldHint}>Voľné termíny podľa aktuálneho trvania. Klikni na termín a predvyplní sa dole.</p>
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  const lastSlot = nextFreeSlots[nextFreeSlots.length - 1];
                  if (!lastSlot) {
                    return;
                  }

                  setAvailabilityCursor(new Date(lastSlot.end.getTime() + 30 * 60 * 1000));
                }}
              >
                Ďalšie termíny
              </button>
            </div>
            <div className={styles.freeSlotsGrid}>
              {nextFreeSlots.map((slot) => {
                const isSelected = selectedDate === slot.dateKey && selectedTime === slot.timeKey;

                return (
                  <button
                    key={`${slot.dateKey}-${slot.timeKey}`}
                    type="button"
                    className={`${styles.freeSlotChip} ${isSelected ? styles.freeSlotChipSelected : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedDate(slot.dateKey);
                      setSelectedTime(slot.timeKey);
                    }}
                  >
                    <span className={styles.freeSlotChipLabel}>{formatFreeSlotLabel(slot.start, slot.timeKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${reservation.id}-date`}>Dátum</label>
          <input
            id={`${reservation.id}-date`}
            name="date-input"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${reservation.id}-time`}>Čas</label>
          <input
            id={`${reservation.id}-time`}
            name="time-input"
            type="time"
            value={selectedTime}
            onChange={(event) => setSelectedTime(event.target.value)}
          />
          <p className={styles.fieldHint}>
            Výber času sa hneď prepočíta. Uloženie zostáva povolené aj pri kolízii.
          </p>
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <p className={styles.sectionKicker}>Obsadené sloty dňa</p>
          <div className={styles.slotGrid} role="radiogroup" aria-label="Obsadené sloty dňa">
            {workingSlots.map((slot) => {
              const busy = slotBusyMap[slot] ?? false;
              const active = selectedTime === slot;

              return (
                <button
                  key={slot}
                  type="button"
                  className={`${styles.slotButton} ${busy ? styles.slotButtonBusy : ''} ${active ? styles.slotButtonActive : ''}`}
                  onClick={() => setSelectedTime(slot)}
                >
                  <span className={styles.slotButtonTime}>{slot}</span>
                  <span className={styles.slotButtonState}>{busy ? 'obsadené' : 'voľné'}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${reservation.id}-durationMin`}>Trvanie</label>
          <select
            id={`${reservation.id}-durationMin`}
            name="durationMin-input"
            value={selectedDuration}
            onChange={(event) => setSelectedDuration(Number(event.target.value))}
          >
            {durationOptions.map((value) => (
              <option key={value} value={value}>
                {value} min
              </option>
            ))}
          </select>
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor={`${reservation.id}-internalNote`}>Interná poznámka</label>
          <textarea id={`${reservation.id}-internalNote`} name="internalNote" defaultValue={reservation.internalNote ?? ''} />
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          {selectedCollisions.length > 0 ? (
            <div className={styles.availabilityBanner}>
              <p className={styles.availabilityTitle}>Koliduje s:</p>
              <div className={styles.collisionList}>
                {selectedCollisions.map((collision) => (
                  <div key={collision.id} className={styles.collisionItem}>
                    <strong>
                      {collision.start} - {collision.end}
                    </strong>
                    <span>
                      {collision.customerName} / {collision.dogName} · {collision.phone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.availabilityFree}>Termín je voľný.</p>
          )}
        </div>
        <div className={styles.actionsRow}>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

function SimpleAction({
  reservationId,
  action,
  label,
  tone = 'ghost',
}: {
  reservationId: string;
  action: ReservationAction;
  label: string;
  tone?: 'ghost' | 'primary';
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <StateBanner state={state} />
      <input type="hidden" name="id" value={reservationId} />
      <button className={`btn ${tone === 'primary' ? 'btn--primary' : 'btn--ghost'}`} type="submit" disabled={pending}>
        {label}
      </button>
    </form>
  );
}

export default function ReservationDetailClient({
  reservation,
}: {
  reservation: {
    id: string;
    status: string;
    statusLabel: string;
    startLabel: string;
    requestedStartIso: string;
    confirmedStartIso: string | null;
    nowIso: string;
    dogSize: string;
    durationMin: number;
    internalNote: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    customerTags: string[];
    customerNote: string | null;
    dogName: string;
    dogBreed: string | null;
    dogSizeLabel: string;
    dogNote: string | null;
    dogTemperamentNote: string | null;
    dogCoatType: string | null;
    dogHealthNote: string | null;
    dogGroomingNotes: string | null;
    cutTypeLabel: string;
    serviceLabel: string;
    customerMessage: string | null;
    availabilityReservations: {
      id: string;
      status: string;
      statusLabel: string;
      requestedStart: string;
      confirmedStart: string | null;
      durationMin: number;
      customerName: string;
      dogName: string;
      customerPhone: string;
    }[];
    collisions: {
      id: string;
      customerName: string;
      dogName: string;
      phone: string;
      start: string;
      end: string;
      status: string;
    }[];
  };
}) {
  const startIso = reservation.confirmedStartIso ?? reservation.requestedStartIso;
  const reservationTimingDefaults = {
    id: reservation.id,
    startIso,
    durationMin: reservation.status === 'PENDING' ? getDefaultDurationForSize(reservation.dogSize) : reservation.durationMin,
    internalNote: reservation.internalNote,
    nowIso: reservation.nowIso,
    availabilityReservations: reservation.availabilityReservations,
  };

  return (
    <div className={styles.detailLayout}>
      <section className={styles.detailSidebar}>
        <article className={styles.detailCard}>
          <p className={styles.sectionKicker}>Kontakt</p>
          <h2 className={styles.detailName}>{reservation.customerName}</h2>
          <a className={styles.callLink} href={`tel:${reservation.customerPhone.replace(/\s+/g, '')}`}>
            {reservation.customerPhone}
          </a>
          <p className={styles.customerTagSummary}>{getCustomerTagSummary(reservation.customerTags)}</p>
          <p className={styles.detailMeta}>{reservation.customerEmail ?? 'Bez emailu'}</p>
          <p className={styles.detailMeta}>{reservation.customerNote ?? 'Bez poznámky'}</p>
        </article>

        <article className={styles.detailCard}>
          <p className={styles.sectionKicker}>Pes</p>
          <h2 className={styles.detailName}>{reservation.dogName}</h2>
          <p className={styles.detailMeta}>{reservation.dogBreed ?? 'Bez plemena'}</p>
          <p className={styles.detailMeta}>{reservation.dogSizeLabel}</p>
          {reservation.dogNote ? <p className={styles.detailMeta}>{reservation.dogNote}</p> : null}
          {reservation.dogTemperamentNote ? <p className={styles.detailMeta}>{reservation.dogTemperamentNote}</p> : null}
          {reservation.dogCoatType ? <p className={styles.detailMeta}>Srsť: {reservation.dogCoatType}</p> : null}
          {reservation.dogHealthNote ? <p className={styles.detailMeta}>{reservation.dogHealthNote}</p> : null}
          {reservation.dogGroomingNotes ? <p className={styles.detailMeta}>{reservation.dogGroomingNotes}</p> : null}
        </article>

        <article className={styles.detailCard}>
          <p className={styles.sectionKicker}>Služby</p>
          <p className={styles.detailMeta}>{reservation.cutTypeLabel}</p>
          <p className={styles.detailMeta}>{reservation.serviceLabel}</p>
          {reservation.customerMessage ? <p className={styles.detailMeta}>{reservation.customerMessage}</p> : null}
        </article>
      </section>

      <section className={styles.detailMain}>
        {reservation.status === 'PENDING' ? (
          <div className={styles.stack}>
            <ReservationTimingForm reservation={reservationTimingDefaults} action={confirmReservation} submitLabel="Potvrdiť" />
            <section className={styles.detailActionsRow}>
              <SimpleAction reservationId={reservation.id} action={declineReservation} label="Zamietnuť" />
            </section>
          </div>
        ) : null}

        {reservation.status === 'CONFIRMED' ? (
          <div className={styles.stack}>
            <ReservationTimingForm reservation={reservationTimingDefaults} action={updateReservation} submitLabel="Uložiť zmeny" />
            <section className={styles.detailActionsRow}>
              <SimpleAction reservationId={reservation.id} action={completeReservation} label="Dokončiť" tone="primary" />
              <SimpleAction reservationId={reservation.id} action={cancelReservation} label="Zrušiť" />
            </section>
          </div>
        ) : null}

        {reservation.status === 'DONE' || reservation.status === 'CANCELLED' ? (
          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>História</p>
            <p className={styles.detailMeta}>Táto rezervácia je už uzavretá.</p>
            {reservation.internalNote ? <p className={styles.detailMeta}>{reservation.internalNote}</p> : null}
          </article>
        ) : null}

        {reservation.collisions.length > 0 ? (
          <article className={styles.collisionCard}>
            <p className={styles.sectionKicker}>Kolízie</p>
            <div className={styles.collisionList}>
              {reservation.collisions.map((collision) => (
                <div key={collision.id} className={styles.collisionItem}>
                  <strong>
                    {collision.start} - {collision.end}
                  </strong>
                  <span>
                    {collision.customerName} / {collision.dogName} · {collision.phone}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
