import type { GarageApi } from '@garage/api-client';
import type { Vehicle, VehicleGroup, VehicleType } from '@garage/contracts';

export const groupTitle: Record<VehicleGroup,string> = { IE:'И.Е.', VE:'В.Е.', OTHER:'Прочие' };
export const vehicleKind: Record<VehicleType,string> = { CAR:'Автомобиль', MOTORCYCLE:'Мотоцикл', ATV:'Квадроцикл', OTHER:'Другая техника' };
export const vehicleStatusTitle = { ACTIVE:'В норме', STORED:'На хранении', SOLD:'Продан', WRITTEN_OFF:'Списан' } as const;
const fallback: Record<VehicleType,string> = {
  CAR:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85',
  MOTORCYCLE:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85',
  ATV:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85',
  OTHER:'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85',
};
export function vehicleImage(vehicle:Vehicle,api:GarageApi){ return api.assetUrl(vehicle.photoPath)??fallback[vehicle.type]; }
