import { StyleSheet, Text, View } from 'react-native';
import type { VehicleStatus } from '../data/garage';
import { colors } from './theme';

export function StatusIndicator({ status }: { status: VehicleStatus }) { const color = status === 'В норме' ? colors.success : status === 'Скоро ТО' ? colors.warning : colors.danger; return <View style={[styles.badge, { backgroundColor: `${color}25` }]}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.text, { color }]}>{status}</Text></View>; }
const styles = StyleSheet.create({ badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 }, dot: { width: 6, height: 6, borderRadius: 3 }, text: { fontSize: 10, fontWeight: '800' } });
