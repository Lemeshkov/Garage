export type Fleet = 'IE' | 'VE' | 'OTHER';
export type VehicleStatus = 'В норме' | 'Скоро ТО' | 'Требует внимания' | 'На хранении' | 'Продан' | 'Списан';
export type Vehicle = {
  id: string; group: Fleet; type: 'CAR' | 'MOTORCYCLE' | 'ATV' | 'OTHER'; name: string; plate: string; mileage: string; kind: string; status: VehicleStatus; lifecycleStatus: 'ACTIVE' | 'STORED' | 'SOLD' | 'WRITTEN_OFF'; vin: string; year: number | null; description?: string | null; photoUrl?: string | null; image: string;
};
export type ServiceEvent = { id: string; fleet: Fleet; title: string; vehicle: string; due: string; severity: 'info' | 'warning' | 'critical' };
// Events are out of scope for the registry and stay empty until their own stage.
export const serviceEvents: ServiceEvent[] = [];
