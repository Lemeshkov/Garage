import { StyleSheet } from 'react-native';

export const colors = { background: '#030d1e', panel: 'rgba(12, 39, 74, 0.54)', border: 'rgba(142, 205, 255, 0.24)', text: '#f2f7ff', muted: '#91acce', blue: '#4d9cff', success: '#5be0a1', warning: '#ffc15a', danger: '#ff8291' };
export const ui = StyleSheet.create({ glass: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.panel, shadowColor: '#1977e5', shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } } });
