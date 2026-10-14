import { apiFetch } from '../auth/session';

export type RecordKind = 'osago' | 'maintenance' | 'tires' | 'batteries' | 'detailing' | 'parts';
export type ServiceRecord = { id: string; [key: string]: unknown };
export type TimelineEvent = { id: string; type: string; occurredAt: string; sourceEntity: string; sourceId: string; description: string; mileage: number | null };
export type MaintenanceSchedule = ServiceRecord & { dueAt: string | null; dueMileage: number | null; mileageWarningThreshold: number };
export type GlobalEvent = { id: string; vehicle: { id: string; name: string; licensePlate: string }; kind: string; section: RecordKind; title: string; dueAt: string | null; daysRemaining: number | null; remainingMileage: number | null; severity: 'OVERDUE' | 'ATTENTION' | 'UPCOMING' };

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
export const getMaintenanceSchedule = (vehicleId: string) => request<MaintenanceSchedule | null>(`/vehicles/${vehicleId}/maintenance-schedule`);
export const saveMaintenanceSchedule = (vehicleId: string, current: MaintenanceSchedule | null, data: object) => request<MaintenanceSchedule>(`/vehicles/${vehicleId}/maintenance-schedule${current ? `/${current.id}` : ''}`, { method: current ? 'PATCH' : 'POST', body: JSON.stringify(data) });
export const getGlobalEvents = () => request<GlobalEvent[]>('/events');
export const uploadOsagoAttachment = (vehicleId: string, id: string, asset: { uri: string; fileName?: string | null; mimeType?: string | null }) => {
  const body = new FormData();
  body.append('document', { uri: asset.uri, name: asset.fileName ?? `osago-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob);
  return request<ServiceRecord>(`/vehicles/${vehicleId}/osago/${id}/attachment`, { method: 'POST', body });
};

