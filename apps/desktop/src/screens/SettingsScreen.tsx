import { InfoBlock,InfoRow } from '../components/InfoBlock/InfoBlock';
import styles from './SettingsScreen.module.css';
import {AdminAccessControl} from '../auth/AdminAccessControl';

export function SettingsScreen(){return <div className={styles.page}><h1>Настройки</h1><InfoBlock title="Приложение"><InfoRow label="Уведомления" value="Позже"/><InfoRow label="Внешний вид" value="Тёмная тема"/><InfoRow label="Версия" value="0.2.0"/></InfoBlock><InfoBlock title="Учётная запись"><InfoRow label="Административный доступ" value={<AdminAccessControl/>}/></InfoBlock></div>}
