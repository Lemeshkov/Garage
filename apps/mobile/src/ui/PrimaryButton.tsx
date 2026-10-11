import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function PrimaryButton({ children, onPress }: { children: ReactNode; onPress?: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}><LinearGradient colors={['#4b9dff', '#2465e9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}><Text style={styles.text}>{children}</Text></LinearGradient></Pressable>; }
const styles = StyleSheet.create({ pressable: { borderRadius: 14, overflow: 'hidden', shadowColor: '#3085ff', shadowOpacity: .42, shadowRadius: 12 }, pressed: { opacity: .85, transform: [{ scale: .98 }] }, button: { paddingHorizontal: 15, paddingVertical: 11, alignItems: 'center' }, text: { color: '#fff', fontSize: 12, fontWeight: '800' } });
