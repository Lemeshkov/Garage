import * as SecureStore from 'expo-secure-store';
import { fetchWithTimeout } from '../api/network';

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
export async function getToken() {
  if (cached !== undefined) return cached;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    cached = await Promise.race([
      SecureStore.getItemAsync(key),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('SecureStore timeout')), 3_000); }),
    ]);
    return cached;
  } catch {
    // A temporary native-storage failure must not clear or overwrite a valid session.
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export async function saveToken(token: string) { cached = token; await SecureStore.setItemAsync(key, token); }
export async function clearToken() { cached = null; await SecureStore.deleteItemAsync(key); }
export function onUnauthorized(handler: () => void) { unauthorizedHandler = handler; return () => { if (unauthorizedHandler === handler) unauthorizedHandler = undefined; }; }
type ApiFetchOptions = { requiresAuth?: boolean; timeoutMs?: number };

export async function apiFetch(path: string, init?: RequestInit, options: ApiFetchOptions = {}) {
  // Public reads must not wait for SecureStore: a delayed native storage call must
  // never prevent the garage list from loading for a guest.
  const token = options.requiresAuth === false ? null : await getToken();
  const response = await fetchWithTimeout(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  }, options.timeoutMs);
  if (options.requiresAuth !== false && (response.status === 401 || response.status === 403)) {
    await clearToken();
    unauthorizedHandler?.();
  }
  return response;
}

