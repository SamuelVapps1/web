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
import { getCustomerTagSummary, getDefaultDurationForSize } from '@/lib/admin-domain';
import ReservationAvailabilityPanel from '../_components/reservation-availability-panel';

const initialState: AdminActionState = { kind: 'idle' };

type ReservationAction = (
  stateOrFormData: AdminActionState | FormData,
  maybeFormData?: FormData,
) => Promise<AdminActionState>;

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Bratislava',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function toTimeInputValue(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bratislava',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

function StateBanner({ state }: { state: AdminActionState }) {
  if (state.kind === 'idle') {
    return null;
  }

  return (
    <div
      className={`${styles.stateBanner} ${
        state.kind === 'error'
          ? styles.stateBannerError
          : state.kind === 'warning'
            ? styles.stateBannerWarning
            : styles.stateBannerSuccess
      }`}
    >
      <p className={styles.stateBannerTitle}>
        {state.kind === 'error'
          ? 'Nepodarilo sa uloĹľiĹĄ'
          : state.kind === 'warning'
            ? 'UloĹľenĂ© s upozornenĂ­m'
            : 'UloĹľenĂ©'}
      </p>
      <p>{state.message}</p>
      {state.kind === 'warning' && state.collisions.length > 0 ? (
        <ul className={styles.stateCollisionList}>
          {state.collisions.map((collision) => (
            <li key={collision.id}>
              {collision.start} - {collision.end} Â· {collision.customerName} / {collision.dogName} Â· {collision.phone}
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
  const [availabilityCursor, setAvailabilityCursor] = useState(() => new Date(reservation.startIso));
  const durationOptions = useMemo(
    () => Array.from({ length: 8 }, (_, index) => (index + 1) * 30),
    [],
  );

  return (
    <section className={styles.detailCard}>
      <StateBanner state={state} />
      <form action={formAction} className={styles.formGrid}>
        <input type="hidden" name="id" value={reservation.id} />
        <input type="hidden" name="date" value={selectedDate} />
        <input type="hidden" name="time" value={selectedTime} />
        <input type="hidden" name="durationMin" value={selectedDuration} />

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <ReservationAvailabilityPanel
            reservations={reservation.availabilityReservations}
            date={selectedDate}
            time={selectedTime}
            durationMin={selectedDuration}
            availabilityCursor={availabilityCursor}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onDurationChange={setSelectedDuration}
            onAvailabilityCursorChange={setAvailabilityCursor}
            durationOptions={durationOptions}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor={`${reservation.id}-internalNote`}>InternĂˇ poznĂˇmka</label>
          <textarea
            id={`${reservation.id}-internalNote`}
            name="internalNote"
            defaultValue={reservation.internalNote ?? ''}
          />
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
      <button
        className={`btn ${tone === 'primary' ? 'btn--primary' : 'btn--ghost'}`}
        type="submit"
        disabled={pending}
      >
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
    durationMin:
      reservation.status === 'PENDING'
        ? getDefaultDurationForSize(reservation.dogSize)
        : reservation.durationMin,
    internalNote: reservation.internalNote,
    availabilityReservations: reservation.availabilityReservations,
  };

  const customerTagSummary = getCustomerTagSummary(reservation.customerTags);

  return (
    <div className={styles.detailLayout}>
      <section className={styles.detailSidebar}>
        <article className={`${styles.detailCard} ${styles.customerPetCard}`}>
          <p className={styles.sectionKicker}>Zákazník &amp; pes</p>
          <div className={styles.customerPetGrid}>
            <div className={styles.customerPetColumn}>
              <h2 className={styles.detailName}>{reservation.customerName}</h2>
              <a className={styles.callLink} href={`tel:${reservation.customerPhone.replace(/\s+/g, '')}`}>
                {reservation.customerPhone}
              </a>
              {reservation.customerEmail ? <p className={styles.detailMeta}>{reservation.customerEmail}</p> : null}
              {reservation.customerNote ? <p className={styles.detailMeta}>{reservation.customerNote}</p> : null}
              {customerTagSummary && customerTagSummary !== 'Bez tagov' ? (
                <p className={styles.customerTagSummary}>{customerTagSummary}</p>
              ) : null}
            </div>

            <div className={styles.customerPetColumn}>
              <h2 className={styles.detailName}>{reservation.dogName}</h2>
              {reservation.dogBreed ? <p className={styles.detailMeta}>{reservation.dogBreed}</p> : null}
              <p className={styles.detailMeta}>{reservation.dogSizeLabel}</p>
              {reservation.dogNote ? <p className={styles.detailMeta}>{reservation.dogNote}</p> : null}
              {reservation.dogTemperamentNote ? (
                <p className={styles.detailMeta}>{reservation.dogTemperamentNote}</p>
              ) : null}
              {reservation.dogCoatType ? <p className={styles.detailMeta}>Srsť: {reservation.dogCoatType}</p> : null}
              {reservation.dogHealthNote ? <p className={styles.detailMeta}>{reservation.dogHealthNote}</p> : null}
              {reservation.dogGroomingNotes ? (
                <p className={styles.detailMeta}>{reservation.dogGroomingNotes}</p>
              ) : null}
            </div>
          </div>
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
            <ReservationTimingForm
              reservation={reservationTimingDefaults}
              action={confirmReservation}
              submitLabel="Potvrdiť"
            />
            <section className={styles.detailActionsRow}>
              <SimpleAction reservationId={reservation.id} action={declineReservation} label="Zamietnuť" />
            </section>
          </div>
        ) : null}

        {reservation.status === 'CONFIRMED' ? (
          <div className={styles.stack}>
            <ReservationTimingForm
              reservation={reservationTimingDefaults}
              action={updateReservation}
              submitLabel="Uložiť zmeny"
            />
            <section className={styles.detailActionsRow}>
              <SimpleAction
                reservationId={reservation.id}
                action={completeReservation}
                label="Dokončiť"
                tone="primary"
              />
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

