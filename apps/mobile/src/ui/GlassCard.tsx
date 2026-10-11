import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { ui } from './theme';

export function GlassCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <BlurView intensity={28} tint="dark" style={[ui.glass, style]}>{children}</BlurView>; }
