import type { Vehicle } from '@garage/contracts';
import { garageApi } from '../../api/garage';
import { vehicleImage, vehicleKind } from '../../lib/vehicle';
import { GlassCard } from '../GlassCard/GlassCard';
import { StatusIndicator } from '../StatusIndicator/StatusIndicator';
import styles from './VehicleCard.module.css';

export function VehicleCard({ vehicle, onOpen }: { vehicle: Vehicle; onOpen: () => void }) {
  return <button type="button" className={styles.button} onClick={onOpen}><GlassCard className={styles.card}><img src={vehicleImage(vehicle, garageApi)} alt={`${vehicle.brand} ${vehicle.model}`} /><div className={styles.gradient} /><div className={styles.copy}><strong>{vehicle.brand} {vehicle.model}</strong><span>{vehicle.licensePlate} · {vehicle.currentMileage===null?'Не указан':`${vehicle.currentMileage.toLocaleString('ru-RU')} км`}</span><StatusIndicator status={vehicle.status}/><span className={styles.kind}>{vehicleKind[vehicle.type]}</span></div></GlassCard></button>;
}
