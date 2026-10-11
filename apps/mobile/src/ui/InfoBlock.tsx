import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { colors } from './theme';

export function InfoBlock({ title, children }: { title: string; children: ReactNode }) { return <GlassCard style={styles.card}><Text style={styles.title}>{title}</Text><View>{children}</View></GlassCard>; }
export function InfoRow({ label, value }: { label: string; value: ReactNode }) { return <View style={styles.row}><Text style={styles.label}>{label}</Text>{typeof value === 'string' ? <Text style={styles.value}>{value}</Text> : value}</View>; }
const styles = StyleSheet.create({ card: { padding: 17, marginTop: 16 }, title: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }, row: { minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(147,204,255,.18)' }, label: { color: '#cbdcf0', fontSize: 13 }, value: { color: '#7eb8ff', fontSize: 12, fontWeight: '700' } });
