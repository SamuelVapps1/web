import styles from '../admin.module.css';

export function AdminPlaceholder({
  eyebrow,
  title,
  description,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={styles.placeholder}>
        <strong>Fáza 1:</strong>
        <span>{note ?? 'Toto je iba skelet admin sekcie. Dáta a workflow prídu vo fáze 2.'}</span>
      </div>
    </section>
  );
}
