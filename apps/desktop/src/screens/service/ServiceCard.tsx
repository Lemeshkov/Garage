import { useCallback,useEffect,useState } from 'react';
import type { OperationEvent,RecordKind } from '@garage/contracts';
import { garageApi } from '../../api/garage';
import { DataState } from '../../components/DataState/DataState';
import { GlassCard } from '../../components/GlassCard/GlassCard';
import type { ServiceSection } from '../VehicleDetailsScreen';
import styles from './ServiceCard.module.css';

const sections:Array<[ServiceSection,string]>=[['osago','ОСАГО'],['maintenance','ТО'],['tires','Шины'],['batteries','Аккумуляторы'],['detailing','Детейлинг'],['parts','Запчасти'],['timeline','История']];
type LooseRecord=Record<string,unknown>&{id:string};

export function ServiceCard({vehicleId,initialSection}:{vehicleId:string;initialSection:ServiceSection}){
 const [section,setSection]=useState<ServiceSection>(initialSection);const [items,setItems]=useState<LooseRecord[]>([]);const [events,setEvents]=useState<OperationEvent[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);
 useEffect(()=>setSection(initialSection),[initialSection]);
 const load=useCallback(async()=>{setLoading(true);setError(null);try{if(section==='timeline'){setEvents(await garageApi.getTimeline(vehicleId));setItems([])}else{setItems(await garageApi.getRecords(vehicleId,section as RecordKind) as unknown as LooseRecord[]);setEvents([])}}catch(e){setError(e instanceof Error?e.message:'Ошибка API.')}finally{setLoading(false)}},[section,vehicleId]);
 useEffect(()=>{void load()},[load]);
 const empty=section==='timeline'?!events.length:!items.length;
 return <section className={styles.wrap}><h2>Сервисная карточка</h2><div className={styles.tabs} role="tablist" aria-label="Разделы сервисной карточки">{sections.map(([id,label])=><button role="tab" aria-selected={section===id} type="button" key={id} className={section===id?styles.active:''} onClick={()=>setSection(id)}>{label}</button>)}</div><DataState loading={loading} error={error} empty={empty} retry={()=>void load()}>{section==='timeline'?<Timeline events={events}/>:<div className={styles.records}>{items.map(item=><GlassCard className={styles.record} key={item.id}><strong>{recordName(section,item)}</strong><p>{recordMeta(section,item)}</p></GlassCard>)}</div>}</DataState></section>;
}

function Timeline({events}:{events:OperationEvent[]}){return <div className={styles.records}>{events.map(event=><GlassCard className={styles.record} key={event.id}><strong>{event.description}</strong><p>{formatDate(event.occurredAt)}{event.mileage!==null?` · ${event.mileage.toLocaleString('ru-RU')} км`:''}</p></GlassCard>)}</div>}
function recordName(section:ServiceSection,item:LooseRecord){if(section==='osago')return item.insurer?`ОСАГО · ${item.insurer}`:'ОСАГО';if(section==='maintenance')return String(item.serviceType??'Техническое обслуживание');if(section==='tires'||section==='batteries')return `${item.brand??''} ${item.model??''}`.trim()||'Запись';if(section==='detailing')return String(item.serviceType??'Детейлинг');return String(item.name??'Запчасть')}
function recordMeta(section:ServiceSection,item:LooseRecord){if(section==='osago')return `${osagoStatus(String(item.calculatedStatus??'ACTIVE'))}${item.policyNumber?` · ${item.policyNumber}`:''}${item.validFrom?` · выдан ${formatDate(String(item.validFrom))}`:''}${item.validUntil?` · до ${formatDate(String(item.validUntil))}`:''}${item.daysRemaining!==null&&item.daysRemaining!==undefined?` · ${Number(item.daysRemaining)<0?'просрочено':'осталось'} ${Math.abs(Number(item.daysRemaining))} дн.`:''}`;if(section==='maintenance')return `${formatDate(String(item.performedAt))}${item.mileage!==null&&item.mileage!==undefined?` · ${Number(item.mileage).toLocaleString('ru-RU')} км`:''}${item.cost?` · ${item.cost} ₽`:''}`;if(section==='tires')return `${item.tireSize??'Размер не указан'} · ${item.quantity??0} шт. · ${item.status??''}`;if(section==='batteries')return `${item.capacityAh?`${item.capacityAh} А·ч · `:''}${item.installedAt?formatDate(String(item.installedAt)):'не установлен'}`;if(section==='detailing')return `${formatDate(String(item.performedAt))}${item.provider?` · ${item.provider}`:''}`;return `${item.quantity??0} шт. · ${item.status??''}`}
function osagoStatus(value:string){return value==='EXPIRED'?'Просрочен':value==='EXPIRING_SOON'?'Скоро заканчивается':'Действует'}
function formatDate(value:string){const parsed=new Date(value);return Number.isNaN(parsed.valueOf())?'Дата не указана':parsed.toLocaleDateString('ru-RU')}
