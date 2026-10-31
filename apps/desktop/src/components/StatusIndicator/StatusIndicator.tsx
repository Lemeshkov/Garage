import type { VehicleStatus } from '@garage/contracts';
import styles from './StatusIndicator.module.css';

const label: Record<VehicleStatus, string> = { ACTIVE: 'В норме', STORED: 'На хранении', SOLD: 'Продан', WRITTEN_OFF: 'Списан' };

export function StatusIndicator({ status }: { status: VehicleStatus }) {
  const tone = status === 'ACTIVE' ? styles.success : status === 'STORED' ? styles.warning : styles.danger;
  return <span className={`${styles.badge} ${tone}`}><span className={styles.dot} />{label[status]}</span>;
}
