import styles from './admin.module.css';
import { logoutAdmin } from './actions';

export function LogoutButton() {
  return (
    <form className={styles.logout} action={logoutAdmin}>
      <button type="submit">Odhlásiť sa</button>
    </form>
  );
}
