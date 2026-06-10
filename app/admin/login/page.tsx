import styles from '../admin.module.css';
import { LoginForm } from './login-form';

export default function AdminLoginPage() {
  return (
    <main className={styles.loginWrap}>
      <section className={styles.loginCard}>
        <div className={styles.loginKicker}>Backstage prístup</div>
        <h1 className={styles.loginTitle}>Prihlásenie pre majiteľku salónu</h1>
        <p className={styles.loginCopy}>
          Použi účet z Supabase Auth. Verejná registrácia je vypnutá.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
