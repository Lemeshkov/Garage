import { GarageApi, MemorySessionTokenStore } from '@garage/api-client';
import { getApiBaseUrl } from '../config/runtime';

// Browser development intentionally keeps the bearer token in memory only.
// The Tauri stage will inject an encrypted native SessionTokenStore adapter.
export const sessionTokenStore = new MemorySessionTokenStore();
export const garageApi = new GarageApi({ baseUrl: getApiBaseUrl(), tokenStore: sessionTokenStore });
