import type { HTMLAttributes, PropsWithChildren } from 'react';
import styles from './GlassCard.module.css';

export function GlassCard({ children, className = '', ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={`${styles.card} ${className}`} {...props}>{children}</div>;
}
