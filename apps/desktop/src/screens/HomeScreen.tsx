import type { Vehicle,VehicleGroup } from '@garage/contracts';
import { DataState } from '../components/DataState/DataState';
import { GroupSwitch } from '../components/GroupSwitch/GroupSwitch';
import { SectionHeader } from '../components/SectionHeader/SectionHeader';
import { VehicleCard } from '../components/VehicleCard/VehicleCard';
import { groupTitle } from '../lib/vehicle';
import styles from './HomeScreen.module.css';

type Props={vehicles:Vehicle[];loading:boolean;error:string|null;reload:()=>Promise<void>;group:VehicleGroup;onGroup:(group:VehicleGroup)=>void;onOpen:(id:string)=>void;onGarage:()=>void};
export function HomeScreen({vehicles,loading,error,reload,group,onGroup,onOpen,onGarage}:Props){const list=vehicles.filter(v=>v.group===group);return <div className={styles.page}><GroupSwitch value={group} onChange={onGroup}/><section className={styles.summary}><span>АВТОПАРК · {groupTitle[group]}</span><strong>{list.length}</strong><p>единиц транспорта<br/>под вашим контролем</p></section><SectionHeader title="Транспорт" action="В гараж" onAction={onGarage}/><DataState loading={loading} error={error} empty={!list.length} emptyText="В этом автопарке пока нет транспорта" retry={()=>void reload()}><div className={styles.grid}>{list.slice(0,3).map(v=><VehicleCard key={v.id} vehicle={v} onOpen={()=>onOpen(v.id)}/>)}</div></DataState></div>}
