import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import styles from './PrimaryButton.module.css';

export function PrimaryButton({ children, className = '', ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button className={`${styles.button} ${className}`} {...props}>{children}</button>;
}
