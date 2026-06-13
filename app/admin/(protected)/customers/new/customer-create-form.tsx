'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import styles from '../../../admin.module.css';
import { createCustomer, type AdminActionState } from '@/app/admin/actions';

type DogDraft = {
  id: string;
  name: string;
  breed: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  note: string;
};

const initialState: AdminActionState = { kind: 'idle' };

function createDogDraft(): DogDraft {
  return {
    id: crypto.randomUUID(),
    name: '',
    breed: '',
    size: 'MEDIUM',
    note: '',
  };
}

function StateBanner({ state }: { state: AdminActionState }) {
  if (state.kind === 'idle') {
    return null;
  }

  return (
    <div className={`${styles.stateBanner} ${state.kind === 'error' ? styles.stateBannerError : styles.stateBannerSuccess}`}>
      <p className={styles.stateBannerTitle}>
        {state.kind === 'error' ? 'Nepodarilo sa uložiť' : 'Uložené'}
      </p>
      <p>{state.message}</p>
      {state.link ? (
        <Link className="btn btn--ghost" href={state.link.href}>
          {state.link.label}
        </Link>
      ) : null}
    </div>
  );
}

export default function CustomerCreateForm() {
  const [state, action, pending] = useActionState(createCustomer, initialState);
  const [dogs, setDogs] = useState<DogDraft[]>([createDogDraft()]);

  function updateDog(id: string, patch: Partial<DogDraft>) {
    setDogs((current) => current.map((dog) => (dog.id === id ? { ...dog, ...patch } : dog)));
  }

  function addDog() {
    setDogs((current) => [...current, createDogDraft()]);
  }

  function removeDog(id: string) {
    setDogs((current) => (current.length > 1 ? current.filter((dog) => dog.id !== id) : current));
  }

  return (
    <section className={styles.detailCard}>
      <StateBanner state={state} />
      <form action={action} className={styles.stack}>
        <div className={styles.profileCard}>
          <div className={styles.profileCardHeader}>
            <div>
              <p className={styles.sectionKicker}>Kontakt</p>
              <h2 className={styles.detailName}>Základné údaje</h2>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="customer-name">Meno</label>
              <input id="customer-name" name="name" autoComplete="name" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="customer-phone">Telefón</label>
              <input id="customer-phone" name="phone" autoComplete="tel" inputMode="tel" required />
            </div>
            <div className={styles.field}>
              <label htmlFor="customer-email">Email</label>
              <input id="customer-email" name="email" type="email" autoComplete="email" />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="customer-note">Interná poznámka</label>
              <textarea id="customer-note" name="note" />
            </div>
          </div>
        </div>

        <div className={styles.profileCard}>
          <div className={styles.profileCardHeader}>
            <div>
              <p className={styles.sectionKicker}>Psy</p>
              <h2 className={styles.detailName}>Pridať psy</h2>
            </div>
            <button className="btn btn--ghost" type="button" onClick={addDog}>
              + Pridať psa
            </button>
          </div>

          <div className={styles.stack}>
            {dogs.map((dog, index) => (
              <article key={dog.id} className={styles.dogCard}>
                <div className={styles.profileCardHeader}>
                  <div>
                    <p className={styles.sectionKicker}>Pes {index + 1}</p>
                    <h3 className={styles.detailName}>{dog.name || 'Nový pes'}</h3>
                  </div>
                  <button className="btn btn--ghost" type="button" onClick={() => removeDog(dog.id)}>
                    Odstrániť
                  </button>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Meno psa</label>
                    <input name="dogName" value={dog.name} onChange={(event) => updateDog(dog.id, { name: event.target.value })} required />
                  </div>
                  <div className={styles.field}>
                    <label>Plemeno</label>
                    <input name="dogBreed" value={dog.breed} onChange={(event) => updateDog(dog.id, { breed: event.target.value })} />
                  </div>
                  <div className={styles.field}>
                    <label>Veľkosť</label>
                    <select name="dogSize" value={dog.size} onChange={(event) => updateDog(dog.id, { size: event.target.value as DogDraft['size'] })}>
                      <option value="SMALL">Malý</option>
                      <option value="MEDIUM">Stredný</option>
                      <option value="LARGE">Veľký</option>
                    </select>
                  </div>
                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label>Poznámka</label>
                    <textarea name="dogNote" value={dog.note} onChange={(event) => updateDog(dog.id, { note: event.target.value })} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? 'Ukladám...' : 'Uložiť zákazníka'}
          </button>
        </div>
      </form>
    </section>
  );
}

