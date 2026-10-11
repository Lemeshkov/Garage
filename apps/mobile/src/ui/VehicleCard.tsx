import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Vehicle } from '../data/garage';
import { GlassCard } from './GlassCard';
import { StatusIndicator } from './StatusIndicator';

export function VehicleCard({ vehicle, onPress }: { vehicle: Vehicle; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}><GlassCard style={styles.card}><Image source={vehicle.image} contentFit="cover" transition={200} style={styles.image} /><LinearGradient colors={['rgba(3,13,30,0)', 'rgba(3,13,30,.98)']} style={StyleSheet.absoluteFill} /><View style={styles.copy}><Text style={styles.name}>{vehicle.name}</Text><Text style={styles.meta}>{vehicle.plate} · {vehicle.mileage}</Text><StatusIndicator status={vehicle.status} /></View></GlassCard></Pressable>; }
const styles = StyleSheet.create({ card: { height: 192, marginBottom: 13 }, image: { ...StyleSheet.absoluteFillObject }, copy: { position: 'absolute', left: 16, right: 16, bottom: 14 }, name: { color: '#fff', fontSize: 17, fontWeight: '800' }, meta: { color: '#d0e3fb', fontSize: 11, marginTop: 4, marginBottom: 9 }, pressed: { opacity: .9, transform: [{ scale: .985 }] } });
