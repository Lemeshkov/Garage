import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = appJson.expo;
  const isProduction = process.env.APP_VARIANT === 'production';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (apiUrl && /localhost|127\.0\.0\.1/i.test(apiUrl)) throw new Error('EXPO_PUBLIC_API_URL must be reachable from a phone and cannot use localhost.');
  if (isProduction && (!apiUrl || !apiUrl.startsWith('https://'))) throw new Error('Production builds require an HTTPS EXPO_PUBLIC_API_URL.');
  return {
    ...config,
    ...base,
    android: { ...base.android },
    ios: {
      ...base.ios,
      infoPlist: {
        ...base.ios.infoPlist,
        ...(isProduction ? {} : { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } }),
      },
    },
    plugins: [
      ...base.plugins,
      ['expo-build-properties', { android: { usesCleartextTraffic: !isProduction } }],
    ],
  } as ExpoConfig;
};
