import type {
  Admin,
  ApiErrorBody,
  GlobalEvent,
  LoginResponse,
  MaintenanceSchedule,
  OperationEvent,
  RecordKind,
  ServiceRecordMap,
  StatusChangeInput,
  Vehicle,
  VehicleDetails,
  VehicleGroup,
  VehicleInput,
} from '@garage/contracts';

export type SessionTokenStore = {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
};

export class MemorySessionTokenStore implements SessionTokenStore {
  #token: string | null = null;
  async get() { return this.#token; }
  async set(token: string) { this.#token = token; }
  async clear() { this.#token = null; }
}

export class GarageApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: ApiErrorBody | null = null) {
    super(message);
    this.name = 'GarageApiError';
  }
}

export type GarageApiOptions = {
  baseUrl: string;
  tokenStore: SessionTokenStore;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  onUnauthorized?: () => void;
};

type RequestOptions = RequestInit & { authenticated?: boolean };

export class GarageApi {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly tokenStore: SessionTokenStore;
  readonly fetcher: typeof fetch;
  readonly onUnauthorized?: () => void;

  constructor(options: GarageApiOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.timeoutMs = options.timeoutMs ?? 12_000;
    this.tokenStore = options.tokenStore;
    const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
    // Keep fetch detached from the GarageApi instance. Some browser fetch
    // implementations reject calls whose receiver is not window/globalThis.
    this.fetcher = (input, init) => fetcher(input, init);
    this.onUnauthorized = options.onUnauthorized;
  }

  assetUrl(relativePath: string | null | undefined) {
    return relativePath ? `${this.baseUrl.replace(/\/api$/, '')}/api/uploads/${relativePath.replace(/^\/+/, '')}` : null;
  }

  getVehicles(group?: VehicleGroup) { return this.request<Vehicle[]>(`/vehicles${group ? `?group=${group}` : ''}`); }
  getVehicle(id: string) { return this.request<VehicleDetails>(`/vehicles/${encodeURIComponent(id)}`); }
  createVehicle(input: VehicleInput) { return this.request<Vehicle>('/vehicles', json('POST', input)); }
  updateVehicle(id: string, input: Partial<VehicleInput>) { return this.request<Vehicle>(`/vehicles/${encodeURIComponent(id)}`, json('PATCH', input)); }
  addMileage(id: string, input: { value: number; comment?: string; recordedAt?: string }) { return this.request(`/vehicles/${encodeURIComponent(id)}/mileage`, json('POST', input)); }
  changeVehicleStatus(id: string, input: StatusChangeInput) { return this.request<Vehicle>(`/vehicles/${encodeURIComponent(id)}/status`, json('POST', input)); }

  uploadVehiclePhoto(id: string, file: File) {
    const body = new FormData(); body.append('photo', file);
    return this.request<Vehicle>(`/vehicles/${encodeURIComponent(id)}/photo`, { method: 'POST', body, authenticated: true });
  }
  archiveVehiclePhoto(id: string) { return this.request<Vehicle>(`/vehicles/${encodeURIComponent(id)}/photo/archive`, { method: 'POST', authenticated: true }); }

  getRecords<K extends RecordKind>(vehicleId: string, kind: K) { return this.request<ServiceRecordMap[K][]>(`/vehicles/${encodeURIComponent(vehicleId)}/${kind}`); }
  createRecord<K extends RecordKind>(vehicleId: string, kind: K, input: object) { return this.request<ServiceRecordMap[K]>(`/vehicles/${encodeURIComponent(vehicleId)}/${kind}`, json('POST', input)); }
  updateRecord<K extends RecordKind>(vehicleId: string, kind: K, id: string, input: object) { return this.request<ServiceRecordMap[K]>(`/vehicles/${encodeURIComponent(vehicleId)}/${kind}/${encodeURIComponent(id)}`, json('PATCH', input)); }
  changeRecordStatus<K extends Exclude<RecordKind, 'osago'>>(vehicleId: string, kind: K, id: string, input: StatusChangeInput) { return this.request<ServiceRecordMap[K]>(`/vehicles/${encodeURIComponent(vehicleId)}/${kind}/${encodeURIComponent(id)}/status`, json('POST', input)); }
  markRecordErroneous<K extends 'tires' | 'batteries' | 'detailing' | 'parts'>(vehicleId: string, kind: K, id: string, reason: string) { return this.request<ServiceRecordMap[K]>(`/vehicles/${encodeURIComponent(vehicleId)}/${kind}/${encodeURIComponent(id)}/mark-erroneous`, json('POST', { reason })); }

  getMaintenanceSchedule(vehicleId: string) { return this.request<MaintenanceSchedule | null>(`/vehicles/${encodeURIComponent(vehicleId)}/maintenance-schedule`); }
  saveMaintenanceSchedule(vehicleId: string, currentId: string | null, input: object) { return this.request<MaintenanceSchedule>(`/vehicles/${encodeURIComponent(vehicleId)}/maintenance-schedule${currentId ? `/${encodeURIComponent(currentId)}` : ''}`, json(currentId ? 'PATCH' : 'POST', input)); }
  getTimeline(vehicleId: string, type?: OperationEvent['type']) { return this.request<OperationEvent[]>(`/vehicles/${encodeURIComponent(vehicleId)}/timeline${type ? `?type=${encodeURIComponent(type)}` : ''}`); }
  getEvents() { return this.request<GlobalEvent[]>('/events'); }

  uploadOsagoAttachment(vehicleId: string, recordId: string, file: File) {
    const body = new FormData(); body.append('document', file);
    return this.request<ServiceRecordMap['osago']>(`/vehicles/${encodeURIComponent(vehicleId)}/osago/${encodeURIComponent(recordId)}/attachment`, { method: 'POST', body, authenticated: true });
  }

  async login(login: string, password: string) {
    const response = await this.request<LoginResponse>('/auth/admin/login', json('POST', { login, password }, false));
    await this.tokenStore.set(response.token);
    return { ...response.admin, mustChangePassword: response.mustChangePassword } satisfies Admin;
  }
  me() { return this.request<Admin>('/auth/admin/me', { authenticated: true }); }
  async logout() {
    try { await this.request('/auth/admin/logout', { method: 'POST', authenticated: true }); }
    finally { await this.tokenStore.clear(); }
  }
  changePassword(currentPassword: string, newPassword: string) { return this.request<{ passwordChanged: true }>('/auth/admin/change-password', json('POST', { currentPassword, newPassword })); }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const authenticated = options.authenticated ?? options.method !== undefined;
    const token = authenticated ? await this.tokenStore.get() : null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      const text = await response.text();
      const body = parseBody(text);
      if (!response.ok) {
        if (authenticated && (response.status === 401 || response.status === 403)) {
          await this.tokenStore.clear(); this.onUnauthorized?.();
        }
        const message = Array.isArray(body?.message) ? body.message.join('\n') : body?.message;
        throw new GarageApiError(message ?? `Сервер вернул ошибку ${response.status}.`, response.status, body);
      }
      return (text ? JSON.parse(text) : null) as T;
    } catch (error) {
      if (error instanceof GarageApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new GarageApiError('Не удалось подключиться к серверу.', 0);
      throw new GarageApiError('Не удалось подключиться к серверу.', 0);
    } finally {
      clearTimeout(timer);
    }
  }
}

function normalizeBaseUrl(value: string) {
  const result = value.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(result) && !result.startsWith('/')) throw new Error('Адрес Garage API должен быть абсолютным URL или начинаться с /.');
  return result;
}

function json(method: 'POST' | 'PATCH', body: object, authenticated = true): RequestOptions {
  return { method, body: JSON.stringify(body), authenticated };
}

function parseBody(text: string): ApiErrorBody | null {
  if (!text) return null;
  try { return JSON.parse(text) as ApiErrorBody; } catch { return null; }
}
