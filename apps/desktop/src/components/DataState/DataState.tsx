import type { ReactNode } from 'react';
import { GlassCard } from '../GlassCard/GlassCard';
import styles from './DataState.module.css';

export function DataState({loading,error,empty,emptyText='Записей пока нет',retry,children}:{loading:boolean;error:string|null;empty:boolean;emptyText?:string;retry:()=>void;children:ReactNode}){
  if(loading)return <GlassCard className={styles.state}><span className={styles.spinner}/><p>Загрузка…</p></GlassCard>;
  if(error)return <GlassCard className={styles.state}><strong>Не удалось подключиться к серверу</strong><p>{error}</p><button type="button" onClick={retry}>Повторить</button></GlassCard>;
  if(empty)return <GlassCard className={styles.state}><i>◇</i><p>{emptyText}</p></GlassCard>;
  return <>{children}</>;
}
