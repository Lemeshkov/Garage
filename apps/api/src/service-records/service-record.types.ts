export type TireSetInput = {
  season: 'SUMMER' | 'WINTER' | 'ALL_SEASON'; brand: string; model: string; tireSize: string;
  quantity: number; purchaseDate?: string | null; purchasePrice?: string | number | null;
  installedAt?: string | null; installedMileage?: number | null; storageLocation?: string | null;
  status: 'INSTALLED' | 'STORED' | 'REMOVED' | 'SOLD' | 'RETIRED'; notes?: string | null; correctionReason?: string | null;
};
export type TireChangeInput = { action: 'INSTALLED' | 'REMOVED'; changedAt: string; mileage?: number | null; notes?: string | null };
export type BatteryInput = {
  brand: string; model: string; capacityAh?: number | null; purchaseDate?: string | null;
  installedAt?: string | null; installedMileage?: number | null; price?: string | number | null;
  warrantyUntil?: string | null; removedAt?: string | null; replacementReason?: string | null; notes?: string | null;
  status?: 'IN_STOCK' | 'INSTALLED' | 'REMOVED' | 'RETIRED'; correctionReason?: string | null;
};
export type DetailingInput = {
  serviceType: string; performedAt: string; provider?: string | null; cost?: string | number | null;
  description?: string | null; protectionValidUntil?: string | null;
  status?: 'PLANNED' | 'COMPLETED' | 'CANCELLED' | 'INACTIVE'; correctionReason?: string | null;
};
export type PartInput = {
  name: string; partNumber?: string | null; manufacturer?: string | null; quantity: number;
  unitPrice?: string | number | null; purchasedAt?: string | null; supplier?: string | null;
  installedAt?: string | null; installedMileage?: number | null;
  status: 'PURCHASED' | 'IN_STOCK' | 'INSTALLED' | 'REMOVED' | 'RETURNED' | 'RETIRED'; notes?: string | null; correctionReason?: string | null;
};
export type StatusChangeInput = { status: string; occurredAt?: string; mileage?: number | null; reason?: string | null; comment?: string | null; initiatedBy?: string | null };
export type SeasonalTireChangeInput = StatusChangeInput & { outgoingTireSetId: string };
export type MarkErroneousInput = { reason: string; initiatedBy?: string | null };
export type OsagoInput = {
  insurer: string; policyNumber: string; validFrom: string; validUntil: string;
  cost?: string | number | null; comment?: string | null; correctionReason?: string | null;
};
export type MaintenanceInput = {
  performedAt: string; mileage?: number | null; serviceType: string; description?: string | null;
  replacedItems?: string | null; cost?: string | number | null; provider?: string | null;
  comment?: string | null; correctionReason?: string | null;
};
export type MaintenanceScheduleInput = {
  dueAt?: string | null; dueMileage?: number | null; mileageWarningThreshold?: number | null;
  warning?: string | null; correctionReason?: string | null;
};

