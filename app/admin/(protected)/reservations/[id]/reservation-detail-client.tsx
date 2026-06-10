'use client';

import { useActionState } from 'react';
import styles from '../../../admin.module.css';
import {
  cancelReservation,
  completeReservation,
  confirmReservation,
  declineReservation,
  updateReservation,
  type AdminActionState,
} from '@/app/admin/actions';
import { getDefaultDurationForSize } from '@/lib/admin-domain';

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
  };
  action: ReservationAction;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const durationOptions = Array.from({ length: 8 }, (_, index) => (index + 1) * 30);

  return (
    <section className={styles.detailCard}>
      <StateBanner state={state} />
      <form action={formAction} className={styles.formGrid}>
        <input type="hidden" name="id" value={reservation.id} />
        <div className={styles.field}>
          <label htmlFor={`${reservation.id}-date`}>Dátum</label>
          <input id={`${reservation.id}-date`} name="date" type="date" defaultValue={toDateInputValue(reservation.startIso)} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${reservation.id}-time`}>Čas</label>
          <input id={`${reservation.id}-time`} name="time" type="time" defaultValue={toTimeInputValue(reservation.startIso)} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${reservation.id}-durationMin`}>Trvanie</label>
          <select id={`${reservation.id}-durationMin`} name="durationMin" defaultValue={reservation.durationMin}>
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
    startLabel: string;
    requestedStartIso: string;
    confirmedStartIso: string | null;
    dogSize: string;
    durationMin: number;
    internalNote: string | null;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    customerNote: string | null;
    dogName: string;
    dogBreed: string | null;
    dogSizeLabel: string;
    cutTypeLabel: string;
    serviceLabel: string;
    customerMessage: string | null;
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
          <p className={styles.detailMeta}>{reservation.customerEmail ?? 'Bez emailu'}</p>
          <p className={styles.detailMeta}>{reservation.customerNote ?? 'Bez poznámky'}</p>
        </article>

        <article className={styles.detailCard}>
          <p className={styles.sectionKicker}>Pes</p>
          <h2 className={styles.detailName}>{reservation.dogName}</h2>
          <p className={styles.detailMeta}>{reservation.dogBreed ?? 'Bez plemena'}</p>
          <p className={styles.detailMeta}>{reservation.dogSizeLabel}</p>
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
