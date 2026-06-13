'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
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
import { getLiveAvailability, mapConfirmedAvailabilityReservations } from '@/lib/admin-availability.js';
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

function formatSmsDateLabel(date: string): string {
  return new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
}

function buildConfirmationSmsBody(params: {
  originalDate: string;
  originalTime: string;
  selectedDate: string;
  selectedTime: string;
}): string {
  const dateLabel = formatSmsDateLabel(params.selectedDate);
  const isRescheduled =
    params.originalDate !== params.selectedDate || params.originalTime !== params.selectedTime;

  if (isRescheduled) {
    return `Dobrý deň. Vašu rezerváciu potvrdzujeme, po vzájomnej dohode bol termín presunutý na ${dateLabel} o ${params.selectedTime}. Tešíme sa na Vás. Laura salón pre psov.`;
  }

  return `Dobrý deň. Vašu rezerváciu potvrdzujeme, termín máte dňa ${dateLabel} o ${params.selectedTime}. Tešíme sa na Vás. Laura salón pre psov.`;
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
  smsHref,
  dateLabel,
  expanded,
  onToggleExpanded,
  selectedDate,
  selectedTime,
  selectedDuration,
  availabilityCursor,
  onDateChange,
  onTimeChange,
  onDurationChange,
  onAvailabilityCursorChange,
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
  smsHref?: string;
  dateLabel: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  selectedDate: string;
  selectedTime: string;
  selectedDuration: number;
  availabilityCursor: Date;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onAvailabilityCursorChange: (value: Date) => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const durationOptions = useMemo(
    () => Array.from({ length: 8 }, (_, index) => (index + 1) * 30),
    [],
  );

  useEffect(() => {
    if (!expanded) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onToggleExpanded();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded, onToggleExpanded]);

  return (
    <section className={styles.detailCard}>
      <StateBanner state={state} />
      <form action={formAction} className={styles.formGrid}>
        <input type="hidden" name="id" value={reservation.id} />
        <input type="hidden" name="date" value={selectedDate} />
        <input type="hidden" name="time" value={selectedTime} />
        <input type="hidden" name="durationMin" value={selectedDuration} />

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <button
            type="button"
            className={styles.scheduleToggle}
            onClick={onToggleExpanded}
          >
            <span className={styles.sectionKicker}>{expanded ? 'Skryť termín' : 'Zmeniť termín'}</span>
            <strong>{dateLabel}</strong>
          </button>
        </div>

        {expanded ? (
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <ReservationAvailabilityPanel
              reservations={reservation.availabilityReservations}
              date={selectedDate}
              time={selectedTime}
              durationMin={selectedDuration}
              availabilityCursor={availabilityCursor}
              expanded={expanded}
              onDateChange={onDateChange}
              onTimeChange={onTimeChange}
              onDurationChange={onDurationChange}
              onAvailabilityCursorChange={onAvailabilityCursorChange}
              durationOptions={durationOptions}
            />
          </div>
        ) : null}

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
          <button
            className="btn btn--primary"
            type="submit"
            disabled={pending}
            onClick={() => {
              if (smsHref) {
                window.open(smsHref, '_blank', 'noopener,noreferrer');
              }
            }}
          >
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
  smsHref,
}: {
  reservationId: string;
  action: ReservationAction;
  label: string;
  tone?: 'ghost' | 'primary';
  smsHref?: string;
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
        onClick={() => {
          if (smsHref) {
            window.open(smsHref, '_blank', 'noopener,noreferrer');
          }
        }}
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
  const [showScheduler, setShowScheduler] = useState(false);
  const startIso = reservation.confirmedStartIso ?? reservation.requestedStartIso;
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(startIso));
  const [selectedTime, setSelectedTime] = useState(() => toTimeInputValue(startIso));
  const [selectedDuration, setSelectedDuration] = useState(
    reservation.status === 'PENDING'
      ? getDefaultDurationForSize(reservation.dogSize)
      : reservation.durationMin,
  );
  const [availabilityCursor, setAvailabilityCursor] = useState(() => new Date(startIso));
  const originalDate = toDateInputValue(reservation.requestedStartIso);
  const originalTime = toTimeInputValue(reservation.requestedStartIso);
  const callHref = `tel:${reservation.customerPhone.replace(/\s+/g, '')}`;
  const smsConfirmHref = `sms:${reservation.customerPhone.replace(/\s+/g, '')}?body=${encodeURIComponent(
    buildConfirmationSmsBody({
      originalDate,
      originalTime,
      selectedDate,
      selectedTime,
    }),
  )}`;
  const smsDeclineHref = `sms:${reservation.customerPhone.replace(/\s+/g, '')}?body=${encodeURIComponent(
    'Ospravedlňujeme sa, ale váš termín nemôžeme potvrdiť. Ozveme sa vám s ďalším návrhom.',
  )}`;
  const confirmedAvailabilityReservations = useMemo(
    () => mapConfirmedAvailabilityReservations(reservation.availabilityReservations),
    [reservation.availabilityReservations],
  );
  const liveCollisions = useMemo(
    () =>
      getLiveAvailability({
        dateKey: selectedDate,
        timeKey: selectedTime,
        durationMin: selectedDuration,
        reservations: confirmedAvailabilityReservations,
      }).collisions,
    [confirmedAvailabilityReservations, selectedDate, selectedDuration, selectedTime],
  );
  const isFree = liveCollisions.length === 0;
  const startLabel = new Intl.DateTimeFormat('sk-SK', {
    timeZone: 'Europe/Bratislava',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(startIso));

  useEffect(() => {
    if (!showScheduler) {
      return;
    }

    document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showScheduler]);

  const reservationTimingDefaults = {
    id: reservation.id,
    startIso,
    durationMin: selectedDuration,
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
              <p>{isFree ? 'Nič nekoliduje' : 'Termín je obsadený'}</p>
            </div>
            <div>
              <span>Služba</span>
              <strong>{reservation.cutTypeLabel}</strong>
              <p>{reservation.serviceLabel}</p>
            </div>
            <div>
              <span>Čas</span>
              <strong>{selectedDuration} min</strong>
              <p>Možno meniť v kalendári nižšie</p>
            </div>
          </div>

          <div className={styles.reservationSummaryActions}>
            <a className="btn btn--ghost" href={callHref}>
              Zavolať
            </a>
            <button className="btn btn--ghost" type="button" onClick={() => setShowScheduler(true)}>
              Zmeniť termín
            </button>
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
              smsHref={smsConfirmHref}
              dateLabel={startLabel}
              expanded={showScheduler}
              onToggleExpanded={() => setShowScheduler((value) => !value)}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedDuration={selectedDuration}
              availabilityCursor={availabilityCursor}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
              onDurationChange={setSelectedDuration}
              onAvailabilityCursorChange={setAvailabilityCursor}
            />
            <section className={styles.detailActionsRow}>
              <SimpleAction
                reservationId={reservation.id}
                action={declineReservation}
                label="Zamietnuť"
                smsHref={smsDeclineHref}
              />
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
              dateLabel={startLabel}
              expanded={showScheduler}
              onToggleExpanded={() => setShowScheduler((value) => !value)}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedDuration={selectedDuration}
              availabilityCursor={availabilityCursor}
              onDateChange={setSelectedDate}
              onTimeChange={setSelectedTime}
              onDurationChange={setSelectedDuration}
              onAvailabilityCursorChange={setAvailabilityCursor}
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

        {liveCollisions.length > 0 ? (
          <article className={styles.collisionCard}>
            <p className={styles.sectionKicker}>Kolízie</p>
            <div className={styles.collisionList}>
              {liveCollisions.map((collision) => (
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

