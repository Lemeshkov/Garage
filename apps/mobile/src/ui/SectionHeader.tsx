import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) { return <View style={styles.row}><Text style={styles.title}>{title}</Text>{action ? <Pressable onPress={onPress} hitSlop={8}><Text style={styles.action}>{action} ›</Text></Pressable> : null}</View>; }
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 12 }, title: { color: colors.text, fontSize: 18, fontWeight: '800' }, action: { color: '#7eb8ff', fontSize: 12, fontWeight: '700' } });
