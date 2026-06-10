import styles from '../diary.module.css';
import { formatDateTimeLocalInput, formatBratislavaDateTime } from '@/lib/time';
import { formatReservationRange, type ReservationRecord } from '@/lib/reservations';
import { updateReservationEndsAtAction, updateReservationStatusAction } from '../actions';

type EntryRowProps = {
  reservation: ReservationRecord;
  view: 'week' | 'day' | 'list';
  dateKey: string;
};

function statusClass(status: ReservationRecord['status']): string {
  switch (status) {
    case 'pending':
      return styles.statusPending;
    case 'confirmed':
      return styles.statusConfirmed;
    case 'cancelled':
      return styles.statusCancelled;
    default:
      return styles.statusCompleted;
  }
}

function statusLabel(status: ReservationRecord['status']): string {
  switch (status) {
    case 'pending':
      return 'Čaká';
    case 'confirmed':
      return 'Potvrdené';
    case 'cancelled':
      return 'Zrušené';
    default:
      return 'Hotové';
  }
}

function dogSizeLabel(value: ReservationRecord['dogSize']): string {
  if (value === 'small') {
    return 'Malý';
  }
  if (value === 'medium') {
    return 'Stredný';
  }
  if (value === 'large') {
    return 'Veľký';
  }
  return '—';
}

function formatValue(value: string | null): string {
  return value && value.trim() ? value : '—';
}

export default function EntryRow({ reservation, view, dateKey }: EntryRowProps) {
  const isBlock = reservation.type === 'block';
  const endsAtLocal = formatDateTimeLocalInput(reservation.endsAt);

  return (
    <article className={`${styles.entryCard} ${reservation.status === 'pending' ? styles.entryCardPending : ''}`}>
      <div className={styles.entryTop}>
        <div>
          <div className={styles.entryTime}>{formatReservationRange(reservation)}</div>
          <div className={styles.dayMeta}>{formatBratislavaDateTime(reservation.startsAt)}</div>
        </div>
        <div className={`${styles.statusPill} ${statusClass(reservation.status)}`}>{statusLabel(reservation.status)}</div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Meno a priezvisko</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{formatValue(reservation.clientName)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Telefón</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{formatValue(reservation.clientPhone)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Meno psa</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{formatValue(reservation.dogName)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Plemeno</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{formatValue(reservation.dogBreed)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Veľkosť psa</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{dogSizeLabel(reservation.dogSize)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Úkon</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{formatValue(reservation.service)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Stav srsti</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{formatValue(reservation.coatState)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Povaha</span>
          <span className={`${styles.fieldValue} ${isBlock ? styles.fieldValueMuted : ''}`}>{formatValue(reservation.temperament)}</span>
        </div>
        <div className={`${styles.field} ${styles.formFieldFull}`}>
          <span className={styles.fieldLabel}>Poznámka (nepovinné)</span>
          <span className={styles.fieldValue}>{formatValue(reservation.notes)}</span>
        </div>
      </div>

      <div className={styles.entryActions}>
        <div className={styles.statusActions}>
          <form action={updateReservationStatusAction}>
            <input type="hidden" name="id" value={reservation.id} />
            <input type="hidden" name="status" value="confirmed" />
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="date" value={dateKey} />
            <button type="submit" className="btn btn--ghost">Potvrdiť</button>
          </form>

          <form action={updateReservationStatusAction}>
            <input type="hidden" name="id" value={reservation.id} />
            <input type="hidden" name="status" value="cancelled" />
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="date" value={dateKey} />
            <button type="submit" className="btn btn--ghost">Zrušiť</button>
          </form>

          <form action={updateReservationStatusAction}>
            <input type="hidden" name="id" value={reservation.id} />
            <input type="hidden" name="status" value="completed" />
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="date" value={dateKey} />
            <button type="submit" className="btn btn--ghost">Označiť ako hotové</button>
          </form>
        </div>

        <div className={styles.timeEditor}>
          <form action={updateReservationEndsAtAction}>
            <input type="hidden" name="id" value={reservation.id} />
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="date" value={dateKey} />
            <input
              type="datetime-local"
              name="endsAtLocal"
              className={styles.timeInput}
              defaultValue={endsAtLocal}
              aria-label="Upraviť čas konca"
            />
            <button type="submit" className="btn btn--ghost" aria-label="Upraviť čas">
              ↺
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
