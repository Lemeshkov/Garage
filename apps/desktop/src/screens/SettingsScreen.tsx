import { InfoBlock,InfoRow } from '../components/InfoBlock/InfoBlock';
import styles from './SettingsScreen.module.css';

export function SettingsScreen(){return <div className={styles.page}><h1>Настройки</h1><InfoBlock title="Приложение"><InfoRow label="Уведомления" value="Позже"/><InfoRow label="Внешний вид" value="Тёмная тема"/><InfoRow label="Версия" value="0.2.0"/></InfoBlock></div>}
