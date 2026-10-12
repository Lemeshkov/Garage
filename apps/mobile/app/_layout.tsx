import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { AdminAuthProvider, useAdminAuth } from '../src/auth/AdminAuth';

void SplashScreen.preventAutoHideAsync();

function AppBootstrap() {
  const { loading } = useAdminAuth();

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (loading) {
    return <View style={styles.splash}>
      <Image source={require('../assets/splash-logo.png')} contentFit="contain" style={styles.logo} />
      <Text style={styles.caption}>ВАШ ЛИЧНЫЙ АВТОПАРК</Text>
    </View>;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

export default function Layout() {
  return <AdminAuthProvider><AppBootstrap /></AdminAuthProvider>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020918' },
  logo: { width: '82%', maxWidth: 420, aspectRatio: 1 },
  caption: { marginTop: 16, color: '#8daaca', fontSize: 11, fontWeight: '800', letterSpacing: 2.2 },
});
