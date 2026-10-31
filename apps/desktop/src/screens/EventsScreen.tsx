import { useCallback,useEffect,useState } from 'react';
import type { GlobalEvent } from '@garage/contracts';
import { garageApi } from '../api/garage';
import { DataState } from '../components/DataState/DataState';
import { GlassCard } from '../components/GlassCard/GlassCard';
import type { ServiceSection } from './VehicleDetailsScreen';
import styles from './EventsScreen.module.css';

export function EventsScreen({onOpen}:{onOpen:(vehicleId:string,section:ServiceSection)=>void}){const [items,setItems]=useState<GlobalEvent[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const load=useCallback(async()=>{setLoading(true);setError(null);try{setItems(await garageApi.getEvents())}catch(e){setError(e instanceof Error?e.message:'Ошибка API.')}finally{setLoading(false)}},[]);useEffect(()=>{void load()},[load]);return <div className={styles.page}><h1>События</h1><DataState loading={loading} error={error} empty={!items.length} emptyText="Нет приближающихся сроков" retry={()=>void load()}><div className={styles.list}>{items.map(item=><button type="button" key={item.id} onClick={()=>onOpen(item.vehicle.id,item.section)}><GlassCard className={styles.card}><span>{item.severity==='OVERDUE'?'ПРОСРОЧЕНО':item.severity==='ATTENTION'?'ТРЕБУЕТ ВНИМАНИЯ':'СКОРО'}</span><strong>{item.title} · {item.vehicle.name}</strong><p>{item.daysRemaining!==null?`${item.daysRemaining<0?'Просрочено на':'Осталось'} ${Math.abs(item.daysRemaining)} дн.`:''}{item.remainingMileage!==null?` ${item.remainingMileage<0?'· превышено':'· осталось'} ${Math.abs(item.remainingMileage).toLocaleString('ru-RU')} км`:''}</p></GlassCard></button>)}</div></DataState></div>}
