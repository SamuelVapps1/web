export const dynamic = 'force-dynamic';

import Link from 'next/link';
import styles from '../../../admin.module.css';
import { ADMIN_CUSTOMER_TAGS, getCustomerTagSummary } from '@/lib/admin-domain';
import { getAdminCustomerDetail } from '@/lib/admin-data';
import { createDog, updateCustomer, updateDog } from '@/app/admin/actions';

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

function DogProfileForm({
  customerId,
  dog,
  submitLabel,
}: {
  customerId: string;
  dog: {
    id?: string;
    name: string;
    breed: string | null;
    size: string;
    note: string | null;
    temperamentNote: string | null;
    coatType: string | null;
    healthNote: string | null;
    groomingNotes: string | null;
  };
  submitLabel: string;
}) {
  const isCreate = !dog.id;

  return (
    <form action={isCreate ? submitCreateDog : submitUpdateDog} className={styles.profileForm}>
      {dog.id ? <input type="hidden" name="id" value={dog.id} /> : null}
      <input type="hidden" name="customerId" value={customerId} />
      <div className={styles.formGrid}>
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
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label>Poznámky</label>
          <textarea name="note" defaultValue={dog.note ?? ''} />
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label>Povaha</label>
          <textarea name="temperamentNote" defaultValue={dog.temperamentNote ?? ''} />
        </div>
        <div className={styles.field}>
          <label>Srsť</label>
          <input name="coatType" defaultValue={dog.coatType ?? ''} />
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label>Zdravotné poznámky</label>
          <textarea name="healthNote" defaultValue={dog.healthNote ?? ''} />
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label>Starostlivosť</label>
          <textarea name="groomingNotes" defaultValue={dog.groomingNotes ?? ''} />
        </div>
        <button className="btn btn--ghost" type="submit">
          {submitLabel}
        </button>
      </div>
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
          <p className={styles.customerTagSummary}>{getCustomerTagSummary(customer.tags)}</p>
        </div>
        <Link className="btn btn--ghost" href="/admin/customers">
          Späť na zoznam
        </Link>
      </section>

      <div className={styles.detailLayout}>
        <section className={styles.detailSidebar}>
          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>Kontakt</p>
            <form action={submitUpdateCustomer} className={styles.profileForm}>
              <input type="hidden" name="id" value={customer.id} />
              <div className={styles.formGrid}>
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
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label>Tagy</label>
                  <div className={styles.tagGrid}>
                    {(() => {
                      const customerTags = customer.tags ?? [];
                      return ADMIN_CUSTOMER_TAGS.map((tag) => {
                        const active = customerTags.includes(tag.value);
                        return (
                          <label key={tag.value} className={`${styles.tagChip} ${active ? styles.tagChipActive : ''}`}>
                            <input type="checkbox" name="tags" value={tag.value} defaultChecked={active} />
                            <span>{tag.label}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>
                <button className="btn btn--primary" type="submit">
                  Uložiť zákazníka
                </button>
              </div>
            </form>
          </article>
        </section>

        <section className={styles.detailMain}>
          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>Psy</p>
            <div className={styles.stack}>
              {customer.dogs.map((dog) => (
                <article key={dog.id} className={styles.profileCard}>
                  <div className={styles.profileCardHeader}>
                    <div>
                      <h2 className={styles.detailName}>{dog.name}</h2>
                      <p className={styles.detailMeta}>
                        {dog.breed ?? 'Bez plemena'} · {dog.size}
                      </p>
                    </div>
                  </div>

                  <DogProfileForm
                    customerId={customer.id}
                    dog={dog}
                    submitLabel="Uložiť psa"
                  />

                  <div className={styles.profileHistory}>
                    <p className={styles.sectionKicker}>História psa</p>
                    {dog.reservations.length > 0 ? (
                      <div className={styles.historyList}>
                        {dog.reservations.map((reservation) => (
                          <Link key={reservation.id} className={styles.historyCard} href={`/admin/reservations/${reservation.id}`}>
                            <strong>{reservation.startLabel}</strong>
                            <span>{reservation.cutTypeLabel} · {reservation.serviceLabel}</span>
                            <span>{reservation.status}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.emptyState}>Tento pes ešte nemá žiadnu rezerváciu.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>Pridať psa</p>
            <DogProfileForm
              customerId={customer.id}
              dog={{
                name: '',
                breed: '',
                size: 'MEDIUM',
                note: '',
                temperamentNote: '',
                coatType: '',
                healthNote: '',
                groomingNotes: '',
              }}
              submitLabel="Pridať psa"
            />
          </article>

          <article className={styles.detailCard}>
            <p className={styles.sectionKicker}>História rezervácií</p>
            <div className={styles.historyList}>
              {customer.reservations.length > 0 ? (
                customer.reservations.map((reservation) => (
                  <Link key={reservation.id} className={styles.historyCard} href={`/admin/reservations/${reservation.id}`}>
                    <strong>{reservation.startLabel}</strong>
                    <span>
                      {reservation.dogName} · {reservation.cutTypeLabel}
                    </span>
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
