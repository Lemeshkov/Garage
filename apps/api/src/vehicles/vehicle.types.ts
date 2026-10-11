import { VehicleGroup, VehicleType } from '@prisma/client';

export type CreateVehicleDto = {
  group: VehicleGroup;
  type: VehicleType;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
  vin: string;
  currentMileage: number | null;
  description?: string;
};

export type UpdateVehicleDto = Partial<CreateVehicleDto>;
export type CreateMileageEntryDto = { value: number; comment?: string; recordedAt?: string };
