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
          ? 'Nepodarilo sa uložiť'
          : state.kind === 'warning'
            ? 'Uložené s upozornením'
            : 'Uložené'}
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
  callHref,
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
  callHref: string;
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
          <label htmlFor={`${reservation.id}-internalNote`}>Interná poznámka</label>
          <textarea
            id={`${reservation.id}-internalNote`}
            name="internalNote"
            defaultValue={reservation.internalNote ?? ''}
          />
        </div>

        <div className={styles.actionsRow}>
          <a className="btn btn--ghost" href={callHref}>
            Zavolať
          </a>
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
  const callHref = `tel:${reservation.customerPhone.replace(/\s+/g, '')}`;
  const isFree = reservation.collisions.length === 0;
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

  return (
    <div className={styles.detailLayout}>
      <section className={styles.detailSidebar}>
        <article className={styles.reservationSummaryCard}>
          <div className={styles.reservationSummaryTop}>
            <div>
              <p className={styles.sectionKicker}>Žiadosť</p>
              <h2 className={styles.reservationSummaryTitle}>
                {reservation.customerName} · {reservation.dogName}
              </h2>
              <p className={styles.reservationSummaryLead}>{reservation.startLabel}</p>
            </div>
            <span className={styles.statusPill}>{reservation.statusLabel}</span>
          </div>

          <div className={styles.reservationSummaryGrid}>
            <div>
              <span>Majiteľ</span>
              <strong>{reservation.customerName}</strong>
              <a className={styles.callLink} href={callHref}>
                {reservation.customerPhone}
              </a>
              <p>{reservation.customerEmail ?? 'Bez emailu'}</p>
            </div>
            <div>
              <span>Pes</span>
              <strong>{reservation.dogName}</strong>
              <p>
                {reservation.dogBreed ?? 'Bez plemena'} · {reservation.dogSizeLabel}
              </p>
              <p>{getCustomerTagSummary(reservation.customerTags)}</p>
            </div>
            <div>
              <span>Termín</span>
              <strong>{reservation.startLabel}</strong>
              <p>{isFree ? 'Termín je voľný' : 'Termín je obsadený'}</p>
            </div>
            <div>
              <span>Služba</span>
              <strong>{reservation.cutTypeLabel}</strong>
              <p>{reservation.serviceLabel}</p>
            </div>
            <div>
              <span>Čas</span>
              <strong>{reservation.durationMin} min</strong>
              <p>Možno meniť v kalendári nižšie</p>
            </div>
          </div>

          <div className={styles.reservationSummaryActions}>
            <a className="btn btn--ghost" href={callHref}>
              Zavolať
            </a>
            <a className="btn btn--ghost" href="#schedule">
              Zmeniť čas
            </a>
          </div>

          {reservation.internalNote ? (
            <div className={styles.reservationNoteBox}>
              <p className={styles.sectionKicker}>Interná poznámka</p>
              <p className={styles.detailMeta}>{reservation.internalNote}</p>
            </div>
          ) : null}
        </article>
      </section>

      <section className={styles.detailMain}>
        {reservation.status === 'PENDING' ? (
          <div id="schedule" className={styles.stack}>
            <ReservationTimingForm
              reservation={reservationTimingDefaults}
              action={confirmReservation}
              submitLabel="Potvrdiť"
              callHref={callHref}
            />
            <section className={styles.detailActionsRow}>
              <SimpleAction reservationId={reservation.id} action={declineReservation} label="Zamietnuť" />
            </section>
          </div>
        ) : null}

        {reservation.status === 'CONFIRMED' ? (
          <div id="schedule" className={styles.stack}>
            <ReservationTimingForm
              reservation={reservationTimingDefaults}
              action={updateReservation}
              submitLabel="Uložiť zmeny"
              callHref={callHref}
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

