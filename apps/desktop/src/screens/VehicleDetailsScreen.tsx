import type { Vehicle } from '@garage/contracts';
import { garageApi } from '../api/garage';
import { GlassCard } from '../components/GlassCard/GlassCard';
import { InfoBlock,InfoRow } from '../components/InfoBlock/InfoBlock';
import { groupTitle,vehicleImage,vehicleKind,vehicleStatusTitle } from '../lib/vehicle';
import { ServiceCard } from './service/ServiceCard';
import styles from './VehicleDetailsScreen.module.css';

export type ServiceSection='osago'|'maintenance'|'tires'|'batteries'|'detailing'|'parts'|'timeline';
export function VehicleDetailsScreen({vehicle,initialSection,onBack}:{vehicle:Vehicle;initialSection:ServiceSection;onBack:()=>void}){return <div className={styles.page}><button type="button" className={styles.back} onClick={onBack} aria-label="Назад">‹</button><div className={styles.heroGrid}><img className={styles.hero} src={vehicleImage(vehicle,garageApi)} alt={`${vehicle.brand} ${vehicle.model}`}/><div className={styles.summary}><span>{groupTitle[vehicle.group]} · {vehicleKind[vehicle.type]}</span><h1>{vehicle.brand} {vehicle.model}</h1><p>{vehicle.licensePlate} · {vehicle.year===null?'Год не указан':`${vehicle.year} г.`} · VIN {vehicle.vin}</p><div className={styles.metrics}><GlassCard><small>Пробег</small><strong>{vehicle.currentMileage===null?'Не указан':`${vehicle.currentMileage.toLocaleString('ru-RU')} км`}</strong></GlassCard><GlassCard><small>Статус</small><strong>{vehicleStatusTitle[vehicle.status]}</strong></GlassCard></div><InfoBlock title="Данные транспорта"><InfoRow label="Госномер" value={vehicle.licensePlate}/><InfoRow label="Описание" value={vehicle.description||'Не указано'}/></InfoBlock></div></div><ServiceCard vehicleId={vehicle.id} initialSection={initialSection}/></div>}
