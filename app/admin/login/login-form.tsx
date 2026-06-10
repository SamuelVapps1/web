'use client';

import { useActionState } from 'react';
import styles from '../admin.module.css';
import { loginAdmin, type AdminLoginState } from '../actions';

const initialState: AdminLoginState = undefined;

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);

  return (
    <form className={styles.form} action={action}>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Heslo</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </div>

      {state?.error ? <p className={styles.error}>{state.error}</p> : null}

      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? 'Prihlasujem…' : 'Prihlásiť sa'}
      </button>
    </form>
  );
}
