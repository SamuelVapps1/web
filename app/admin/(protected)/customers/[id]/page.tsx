export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../../admin.module.css';
import { getAdminCustomerDetail } from '@/lib/admin-data';
import { createDog, updateCustomer, updateDog, updateNotes } from '@/app/admin/actions';

async function submitUpdateCustomer(formData: FormData) {
  'use server';
  await updateCustomer(formData);
}

async function submitUpdateDog(formData: FormData) {
  'use server';
  await updateDog(formData);
}

async function submitCreateDog(formData: FormData) {
  'use server';
  await createDog(formData);
}

async function submitUpdateNotes(formData: FormData) {
  'use server';
  await updateNotes(formData);
}

function NotesForm({
  id,
  target,
  note,
  kind,
  label,
}: {
  id: string;
  target: 'customer' | 'dog' | 'reservation';
  note: string | null;
  kind?: 'temperament' | 'health';
  label: string;
}) {
  return (
    <form action={submitUpdateNotes} className={styles.inlineForm}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="target" value={target} />
      {kind ? <input type="hidden" name="kind" value={kind} /> : null}
      <div className={styles.field}>
        <label>{label}</label>
        <textarea name="note" defaultValue={note ?? ''} />
      </div>
      <button className="btn btn--ghost" type="submit">
        Uložiť
      </button>
    </form>
  );
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getAdminCustomerDetail(id);

  if (!customer) {
    return (
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Zákazník</p>
        <h1 className={styles.pageTitle}>Zákazník sa nenašiel</h1>
        <Link className="btn btn--ghost" href="/admin/customers">
          Späť na zoznam
        </Link>
      </section>
    );
  }

  return (
    <div className={styles.customerDetailPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Zákazník</p>
          <h1 className={styles.pageTitle}>{customer.name}</h1>
          <p className={styles.pageLead}>{customer.phone}</p>
        </div>
        <Link className="btn btn--ghost" href="/admin/customers">
          Späť na zoznam
        </Link>
      </section>

      <div className={styles.detailLayout}>
        <section className={styles.detailSidebar}>
          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>Kontakt</p>
    <form action={submitUpdateCustomer} className={styles.formGrid}>
              <input type="hidden" name="id" value={customer.id} />
              <div className={styles.field}>
                <label>Meno</label>
                <input name="name" defaultValue={customer.name} />
              </div>
              <div className={styles.field}>
                <label>Telefón</label>
                <input name="phone" defaultValue={customer.phone} />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input name="email" defaultValue={customer.email ?? ''} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label>Poznámka</label>
                <textarea name="note" defaultValue={customer.note ?? ''} />
              </div>
              <button className="btn btn--primary" type="submit">
                Uložiť zákazníka
              </button>
            </form>
          </article>
        </section>

        <section className={styles.detailMain}>
          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>Psy</p>
            <div className={styles.stack}>
              {customer.dogs.map((dog) => (
                <article key={dog.id} className={styles.dogCard}>
                  <form action={submitUpdateDog} className={styles.formGrid}>
                    <input type="hidden" name="id" value={dog.id} />
                    <input type="hidden" name="customerId" value={customer.id} />
                    <div className={styles.field}>
                      <label>Meno psa</label>
                      <input name="name" defaultValue={dog.name} />
                    </div>
                    <div className={styles.field}>
                      <label>Plemeno</label>
                      <input name="breed" defaultValue={dog.breed ?? ''} />
                    </div>
                    <div className={styles.field}>
                      <label>Veľkosť</label>
                      <select name="size" defaultValue={dog.size}>
                        <option value="SMALL">Malý</option>
                        <option value="MEDIUM">Stredný</option>
                        <option value="LARGE">Veľký</option>
                      </select>
                    </div>
                    <button className="btn btn--ghost" type="submit">
                      Uložiť psa
                    </button>
                  </form>
                  <div className={styles.noteGrid}>
                    <NotesForm id={dog.id} target="dog" kind="temperament" note={dog.temperamentNote} label="Poznámka o povahe" />
                    <NotesForm id={dog.id} target="dog" kind="health" note={dog.healthNote} label="Poznámka o zdraví" />
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>Pridať psa</p>
            <form action={submitCreateDog} className={styles.formGrid}>
              <input type="hidden" name="customerId" value={customer.id} />
              <div className={styles.field}>
                <label>Meno psa</label>
                <input name="name" />
              </div>
              <div className={styles.field}>
                <label>Plemeno</label>
                <input name="breed" />
              </div>
              <div className={styles.field}>
                <label>Veľkosť</label>
                <select name="size" defaultValue="MEDIUM">
                  <option value="SMALL">Malý</option>
                  <option value="MEDIUM">Stredný</option>
                  <option value="LARGE">Veľký</option>
                </select>
              </div>
              <button className="btn btn--primary" type="submit">
                Pridať psa
              </button>
            </form>
          </article>

          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>História rezervácií</p>
            <div className={styles.historyList}>
              {customer.reservations.length > 0 ? (
                customer.reservations.map((reservation) => (
                  <Link key={reservation.id} className={styles.historyCard} href={`/admin/reservations/${reservation.id}`}>
                    <strong>{reservation.startLabel}</strong>
                    <span>{reservation.dogName} · {reservation.cutTypeLabel}</span>
                    <span>{reservation.internalNote ?? 'Bez internej poznámky'}</span>
                  </Link>
                ))
              ) : (
                <p className={styles.emptyState}>Zatiaľ žiadne rezervácie.</p>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
