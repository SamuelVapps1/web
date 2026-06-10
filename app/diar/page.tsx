import type { Metadata } from 'next';
import styles from './diary.module.css';
import DiaryShell from './_components/diary-shell';
import EntryRow from './_components/entry-row';
import { createDiaryBlockAction, createDiaryBookingAction } from './actions';
import { listReservationsBetween } from '@/lib/db';
import {
  addDaysToDateKey,
  endOfBratislavaDayUtc,
  formatBratislavaDate,
  formatBratislavaWeekday,
  formatDateTimeLocalInput,
  getBratislavaDateKey,
  parseDateKey,
  startOfBratislavaDayUtc,
} from '@/lib/time';
import {
  groupReservationsByDate,
  getWeekDateKeys,
  getWeekRangeLabel,
  type ReservationRecord,
} from '@/lib/reservations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Diár',
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Record<string, string | string[] | undefined>;

type ViewMode = 'week' | 'day' | 'list';

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeView(value: string | null): ViewMode {
  if (value === 'day' || value === 'list') {
    return value;
  }

  return 'week';
}

function normalizeDateKey(value: string | null): string {
  if (!value) {
    return getBratislavaDateKey();
  }

  try {
    const parsed = parseDateKey(value);
    const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0));
    return getBratislavaDateKey(date);
  } catch {
    return getBratislavaDateKey();
  }
}

function diaryErrorMessage(value: string | null): string | null {
  switch (value) {
    case 'invalid':
      return 'Nepodarilo sa uložiť zmenu.';
    case 'missing':
      return 'Záznam sa nenašiel.';
    case 'slot':
      return 'Termín sa už medzitým obsadil.';
    case 'error':
      return 'Niečo sa pokazilo.';
    default:
      return null;
  }
}

function formatReservationDay(dateKey: string): string {
  const parsed = parseDateKey(dateKey);
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0));
  return `${formatBratislavaWeekday(date)} · ${formatBratislavaDate(date)}`;
}

function filterReservationDays(
  view: ViewMode,
  anchorDateKey: string,
  reservations: ReservationRecord[],
): string[] {
  if (view === 'day') {
    return [anchorDateKey];
  }

  if (view === 'week') {
    return getWeekDateKeys(anchorDateKey);
  }

  return Array.from(groupReservationsByDate(reservations).keys()).sort();
}

function buildRangeLabel(view: ViewMode, anchorDateKey: string, rangeStart: string, rangeEnd: string): string {
  if (view === 'week') {
    return getWeekRangeLabel(anchorDateKey);
  }

  if (view === 'day') {
    const parsed = parseDateKey(anchorDateKey);
    const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0));
    return formatBratislavaDate(date);
  }

  const startParsed = parseDateKey(rangeStart);
  const endParsed = parseDateKey(rangeEnd);
  const startDate = new Date(Date.UTC(startParsed.year, startParsed.month - 1, startParsed.day, 12, 0, 0));
  const endDate = new Date(Date.UTC(endParsed.year, endParsed.month - 1, endParsed.day, 12, 0, 0));
  return `${formatBratislavaDate(startDate)} – ${formatBratislavaDate(endDate)}`;
}

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const view = normalizeView(firstValue(searchParams.view));
  const anchorDateKey = normalizeDateKey(firstValue(searchParams.date));
  const errorMessage = diaryErrorMessage(firstValue(searchParams.error));
  const rangeStartKey = addDaysToDateKey(anchorDateKey, -30);
  const rangeEndKey = addDaysToDateKey(anchorDateKey, 180);

  const reservations = await listReservationsBetween(
    startOfBratislavaDayUtc(rangeStartKey),
    endOfBratislavaDayUtc(rangeEndKey),
  );
  const groupedReservations = groupReservationsByDate(reservations);
  const visibleDates = filterReservationDays(view, anchorDateKey, reservations);
  const rangeLabel = buildRangeLabel(view, anchorDateKey, rangeStartKey, rangeEndKey);

  const sidebar = (
    <div className={styles.stack}>
      <section className={styles.formSection}>
        <h2 className={styles.formTitle}>Pridať termín</h2>
        <form action={createDiaryBookingAction} className={styles.formGrid}>
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="date" value={anchorDateKey} />

          <div className={styles.formColumns}>
            <label className={styles.formField}>
              <span className={styles.formLabel}>Termín</span>
              <input
                type="datetime-local"
                name="startsAtLocal"
                className={styles.formInput}
                defaultValue={formatDateTimeLocalInput(new Date())}
                required
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>Veľkosť psa</span>
              <select name="dogSize" className={styles.formSelect} defaultValue="medium" required>
                <option value="small">Malý</option>
                <option value="medium">Stredný</option>
                <option value="large">Veľký</option>
              </select>
            </label>

            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span className={styles.formLabel}>Meno a priezvisko</span>
              <input name="clientName" className={styles.formInput} required />
            </label>

            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span className={styles.formLabel}>Telefón</span>
              <input
                name="clientPhone"
                className={styles.formInput}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+421 944 240 116"
                pattern="^(?:\\+421|0)\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}$"
                required
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>Meno psa</span>
              <input name="dogName" className={styles.formInput} required />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>Plemeno</span>
              <input name="dogBreed" className={styles.formInput} required />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>Úkon</span>
              <input name="service" className={styles.formInput} required />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>Stav srsti</span>
              <select name="coatState" className={styles.formSelect} defaultValue="Bežná" required>
                <option value="Bežná">Bežná</option>
                <option value="Mierne zaplstnatená">Mierne zaplstnatená</option>
                <option value="Silne splstnatená">Silne splstnatená</option>
              </select>
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>Povaha</span>
              <select name="temperament" className={styles.formSelect} defaultValue="Pokojný" required>
                <option value="Pokojný">Pokojný</option>
                <option value="Nervózny">Nervózny</option>
                <option value="Reaktívny / ťažko zvládnuteľný">Reaktívny / ťažko zvládnuteľný</option>
              </select>
            </label>

            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span className={styles.formLabel}>Poznámka (nepovinné)</span>
              <textarea name="notes" className={styles.formTextarea} />
            </label>
          </div>

          <button type="submit" className="btn btn--primary">Pridať termín</button>
        </form>
      </section>

      <section className={styles.formSection}>
        <h2 className={styles.formTitle}>Blokovať čas</h2>
        <form action={createDiaryBlockAction} className={styles.formGrid}>
          <input type="hidden" name="view" value={view} />
          <input type="hidden" name="date" value={anchorDateKey} />

          <div className={styles.formColumns}>
            <label className={styles.formField}>
              <span className={styles.formLabel}>Začiatok</span>
              <input
                type="datetime-local"
                name="startsAtLocal"
                className={styles.formInput}
                defaultValue={formatDateTimeLocalInput(new Date())}
                required
              />
            </label>

            <label className={styles.formField}>
              <span className={styles.formLabel}>Koniec</span>
              <input
                type="datetime-local"
                name="endsAtLocal"
                className={styles.formInput}
                defaultValue={formatDateTimeLocalInput(new Date(Date.now() + 60 * 60 * 1000))}
                required
              />
            </label>

            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span className={styles.formLabel}>Poznámka (nepovinné)</span>
              <textarea name="notes" className={styles.formTextarea} />
            </label>
          </div>

          <button type="submit" className="btn btn--primary">Blokovať čas</button>
        </form>
      </section>
    </div>
  );

  return (
    <main className={styles.page}>
      <DiaryShell
        view={view}
        dateKey={anchorDateKey}
        errorMessage={errorMessage}
        rangeLabel={rangeLabel}
        sidebar={sidebar}
      >
        {view === 'list' ? (
          <div className={styles.stack}>
            {reservations.length === 0 ? (
              <div className={styles.empty}>Žiadne záznamy.</div>
            ) : (
              reservations.map((reservation) => (
                <EntryRow key={reservation.id} reservation={reservation} view={view} dateKey={anchorDateKey} />
              ))
            )}
          </div>
        ) : (
          <div className={styles.stack}>
            {visibleDates.map((dateKey) => {
              const dayReservations = groupedReservations.get(dateKey) ?? [];

              return (
                <section key={dateKey} className={styles.dayGroup}>
                  <div className={styles.dayHeader}>
                    <h2>{formatReservationDay(dateKey)}</h2>
                    <div className={styles.dayMeta}>{dayReservations.length} termínov</div>
                  </div>

                  {dayReservations.length === 0 ? (
                    <div className={styles.empty}>Žiadne záznamy.</div>
                  ) : (
                    <div className={styles.entryList}>
                      {dayReservations.map((reservation) => (
                        <EntryRow key={reservation.id} reservation={reservation} view={view} dateKey={dateKey} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </DiaryShell>
    </main>
  );
}
