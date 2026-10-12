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

export type UpdateVehicleDto = Partial<CreateVehicleDto> & { correctionReason?: string };
export type CreateMileageEntryDto = { value: number; comment?: string; recordedAt?: string };
export type ChangeVehicleStatusDto = { status: 'ACTIVE' | 'STORED' | 'SOLD' | 'WRITTEN_OFF'; occurredAt?: string; reason?: string | null; comment?: string | null; initiatedBy?: string | null };
export type MarkMileageErroneousDto = { reason: string; initiatedBy?: string | null };
