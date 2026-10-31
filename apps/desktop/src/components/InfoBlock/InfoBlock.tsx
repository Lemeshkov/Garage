import type { ReactNode } from 'react';
import { GlassCard } from '../GlassCard/GlassCard';
import styles from './InfoBlock.module.css';

export function InfoBlock({ title, children }: { title: string; children: ReactNode }) { return <GlassCard className={styles.card}><h3>{title}</h3>{children}</GlassCard>; }
export function InfoRow({ label, value }: { label: string; value: ReactNode }) { return <div className={styles.row}><span>{label}</span><strong>{value}</strong></div>; }
