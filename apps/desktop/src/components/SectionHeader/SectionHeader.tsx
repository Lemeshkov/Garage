import styles from './SectionHeader.module.css';

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className={styles.row}><h2>{title}</h2>{action&&<button type="button" onClick={onAction}>{action} ›</button>}</div>;
}
