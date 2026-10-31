import type { VehicleGroup } from '@garage/contracts';
import { groupTitle } from '../../lib/vehicle';
import styles from './GroupSwitch.module.css';

const groups:VehicleGroup[]=['IE','VE','OTHER'];
export function GroupSwitch({value,onChange}:{value:VehicleGroup;onChange:(group:VehicleGroup)=>void}){return <div className={styles.switcher} role="tablist" aria-label="Группа транспорта">{groups.map(group=><button role="tab" aria-selected={value===group} type="button" key={group} className={value===group?styles.active:''} onClick={()=>onChange(group)}>{groupTitle[group]}</button>)}</div>}
