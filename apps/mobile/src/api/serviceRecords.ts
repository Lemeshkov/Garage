import { apiFetch } from '../auth/session';

export type RecordKind = 'tires' | 'batteries' | 'detailing' | 'parts';
export type ServiceRecord = { id: string; [key: string]: unknown };
export type TimelineEvent = { id: string; type: string; occurredAt: string; sourceEntity: string; sourceId: string; description: string; mileage: number | null };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join('\n') : body?.message;
    throw new Error(message ?? `Ошибка сервера (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const getServiceRecords = (vehicleId: string, kind: RecordKind) => request<ServiceRecord[]>(`/vehicles/${vehicleId}/${kind}`);
export const createServiceRecord = (vehicleId: string, kind: RecordKind, data: object) => request<ServiceRecord>(`/vehicles/${vehicleId}/${kind}`, { method: 'POST', body: JSON.stringify(data) });
export const updateServiceRecord = (vehicleId: string, kind: RecordKind, id: string, data: object) => request<ServiceRecord>(`/vehicles/${vehicleId}/${kind}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const changeServiceStatus = (vehicleId: string, kind: RecordKind, id: string, status: string, reason?: string) => request<ServiceRecord>(`/vehicles/${vehicleId}/${kind}/${id}/status`, { method: 'POST', body: JSON.stringify({ status, reason: reason || undefined, occurredAt: new Date().toISOString() }) });
export const markServiceErroneous = (vehicleId: string, kind: RecordKind, id: string, reason: string) => request<ServiceRecord>(`/vehicles/${vehicleId}/${kind}/${id}/mark-erroneous`, { method: 'POST', body: JSON.stringify({ reason }) });
export const getTimeline = (vehicleId: string, type?: string) => request<TimelineEvent[]>(`/vehicles/${vehicleId}/timeline${type ? `?type=${encodeURIComponent(type)}` : ''}`);

