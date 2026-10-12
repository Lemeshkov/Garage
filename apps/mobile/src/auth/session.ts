import * as SecureStore from 'expo-secure-store';

const key = 'garage.admin.session';
let cached: string | null | undefined;
let unauthorizedHandler: (() => void) | undefined;
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
export const apiBaseUrl = configuredApiUrl ?? (__DEV__ ? 'http://10.0.2.2:3000/api' : '');
export function apiUrl(path: string) {
  if (!apiBaseUrl) throw new Error('Адрес API не настроен для этой сборки. Укажите EXPO_PUBLIC_API_URL.');
  if (/localhost|127\.0\.0\.1/i.test(apiBaseUrl)) throw new Error('Адрес API должен быть доступен с телефона и не может использовать localhost.');
  if (!__DEV__ && process.env.EXPO_PUBLIC_APP_VARIANT !== 'preview' && !apiBaseUrl.startsWith('https://')) throw new Error('Рабочая сборка требует HTTPS-адрес API.');
  return `${apiBaseUrl}${path}`;
}
export async function getToken() { if (cached === undefined) cached = await SecureStore.getItemAsync(key); return cached; }
export async function saveToken(token: string) { cached = token; await SecureStore.setItemAsync(key, token); }
export async function clearToken() { cached = null; await SecureStore.deleteItemAsync(key); }
export function onUnauthorized(handler: () => void) { unauthorizedHandler = handler; return () => { if (unauthorizedHandler === handler) unauthorizedHandler = undefined; }; }
export async function apiFetch(path: string, init?: RequestInit) { const token = await getToken(); const response = await fetch(apiUrl(path), { ...init, headers: { ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } }); if (response.status === 401 || response.status === 403) { await clearToken(); unauthorizedHandler?.(); } return response; }

