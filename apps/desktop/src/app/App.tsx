import { useEffect,useState } from 'react';
import type { VehicleGroup } from '@garage/contracts';
import { useVehicles } from '../hooks/useVehicles';
import { HomeScreen } from '../screens/HomeScreen';
import { GarageScreen } from '../screens/GarageScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VehicleDetailsScreen, type ServiceSection } from '../screens/VehicleDetailsScreen';
import styles from './App.module.css';
import splashLogo from '../../../mobile/assets/splash-logo.png';

type Tab='home'|'garage'|'events'|'settings';
const tabs:Array<[Tab,string,string]>=[['home','⌂','Главная'],['garage','▱','Гараж'],['events','◷','События'],['settings','⚙','Настройки']];

export function App(){
 const [booting,setBooting]=useState(true);const [tab,setTab]=useState<Tab>('home');const [group,setGroup]=useState<VehicleGroup>('VE');const [archive,setArchive]=useState(false);const [selected,setSelected]=useState<{id:string;section:ServiceSection}|null>(null);const fleet=useVehicles();const vehicle=selected?fleet.vehicles.find(item=>item.id===selected.id):null;
 useEffect(()=>{const timer=setTimeout(()=>setBooting(false),650);return()=>clearTimeout(timer)},[]);
 const open=(id:string,section:ServiceSection='osago')=>setSelected({id,section});
 if(booting)return <div className={styles.startup}><img src={splashLogo} alt="Garage"/><span>ВАШ ЛИЧНЫЙ АВТОПАРК</span></div>;
 return <div className={styles.shell}><div className={styles.glowOne}/><div className={styles.glowTwo}/><header className={styles.header}><div><div className={styles.logo}>GARAGE</div><div className={styles.subtitle}>ВАШ ЛИЧНЫЙ АВТОПАРК</div></div><button disabled title="Административный режим будет подключён на этапе 3" className={styles.admin}>Вход администратора</button></header><main className={styles.main}>{vehicle?<VehicleDetailsScreen vehicle={vehicle} initialSection={selected!.section} onBack={()=>setSelected(null)}/>:<>{tab==='home'&&<HomeScreen {...fleet} group={group} onGroup={setGroup} onOpen={id=>open(id)} onGarage={()=>setTab('garage')}/>} {tab==='garage'&&<GarageScreen {...fleet} group={group} onGroup={setGroup} archive={archive} onArchive={setArchive} onOpen={id=>open(id)}/>} {tab==='events'&&<EventsScreen onOpen={(id,section)=>open(id,section)}/>} {tab==='settings'&&<SettingsScreen/>}</>}</main>{!vehicle&&<nav className={styles.nav} aria-label="Основная навигация">{tabs.map(([id,icon,label])=><button type="button" key={id} className={tab===id?styles.active:''} onClick={()=>setTab(id)}><span>{icon}</span>{label}</button>)}</nav>}</div>;
}
