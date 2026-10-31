export type VehicleGroup = 'IE' | 'VE' | 'OTHER';
export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'ATV' | 'OTHER';
export type VehicleStatus = 'ACTIVE' | 'STORED' | 'SOLD' | 'WRITTEN_OFF';
export type RecordKind = 'osago' | 'maintenance' | 'tires' | 'batteries' | 'detailing' | 'parts';
export type MoneyValue = string | number | null;

export type Vehicle = {
  id: string;
  group: VehicleGroup;
  type: VehicleType;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
  vin: string;
  currentMileage: number | null;
  description: string | null;
  photoPath: string | null;
  status: VehicleStatus;
  statusChangedAt: string;
  statusReason: string | null;
  statusComment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MileageEntry = {
  id: string;
  vehicleId: string;
  value: number;
  comment: string | null;
  recordedAt: string;
  createdAt: string;
  isErroneous: boolean;
  erroneousAt: string | null;
  erroneousReason: string | null;
};

export type VehicleDetails = Vehicle & { mileageHistory: MileageEntry[] };

export type VehicleInput = {
  group: VehicleGroup;
  type: VehicleType;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
  vin: string;
  currentMileage: number | null;
  description?: string | null;
  correctionReason?: string | null;
};

export type StatusChangeInput = {
  status: string;
  occurredAt?: string;
  mileage?: number | null;
  reason?: string | null;
  comment?: string | null;
};

export type OsagoRecord = {
  id: string;
  vehicleId: string;
  type: 'OSAGO';
  insurer: string | null;
  policyNumber: string | null;
  validFrom: string;
  validUntil: string | null;
  cost: MoneyValue;
  comment: string | null;
  attachmentPath: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'CANCELLED';
  daysRemaining: number | null;
  calculatedStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
};

export type OsagoInput = {
  validFrom: string;
  insurer?: string | null;
  policyNumber?: string | null;
  validUntil?: string | null;
  cost?: MoneyValue;
  comment?: string | null;
  correctionReason?: string | null;
};

export type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  performedAt: string;
  mileage: number | null;
  serviceType: string | null;
  description: string | null;
  replacedItems: string | null;
  cost: MoneyValue;
  provider: string | null;
  comment: string | null;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceInput = {
  performedAt: string;
  mileage?: number | null;
  serviceType?: string | null;
  description?: string | null;
  replacedItems?: string | null;
  cost?: MoneyValue;
  provider?: string | null;
  comment?: string | null;
  correctionReason?: string | null;
};

export type MaintenanceSchedule = {
  id: string;
  vehicleId: string;
  dueAt: string | null;
  dueMileage: number | null;
  warning: string | null;
  mileageWarningThreshold: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
};

export type TireSet = {
  id: string;
  vehicleId: string;
  season: 'SUMMER' | 'WINTER' | 'ALL_SEASON';
  brand: string;
  model: string;
  tireSize: string;
  quantity: number;
  purchaseDate: string | null;
  purchasePrice: MoneyValue;
  installedAt: string | null;
  installedMileage: number | null;
  storageLocation: string | null;
  status: 'INSTALLED' | 'STORED' | 'REMOVED' | 'SOLD' | 'RETIRED';
  notes: string | null;
  isErroneous: boolean;
  changes?: TireChangeHistory[];
  createdAt: string;
  updatedAt: string;
};

export type TireChangeHistory = {
  id: string;
  vehicleId: string;
  tireSetId: string;
  action: 'INSTALLED' | 'REMOVED';
  changedAt: string;
  mileage: number | null;
  notes: string | null;
};

export type VehicleBattery = {
  id: string;
  vehicleId: string;
  brand: string;
  model: string;
  capacityAh: number | null;
  purchaseDate: string | null;
  installedAt: string | null;
  installedMileage: number | null;
  price: MoneyValue;
  warrantyUntil: string | null;
  removedAt: string | null;
  replacementReason: string | null;
  notes: string | null;
  status: 'IN_STOCK' | 'INSTALLED' | 'REMOVED' | 'RETIRED';
  isErroneous: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DetailingRecord = {
  id: string;
  vehicleId: string;
  serviceType: string;
  performedAt: string;
  provider: string | null;
  cost: MoneyValue;
  description: string | null;
  protectionValidUntil: string | null;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED' | 'INACTIVE';
  isErroneous: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VehiclePart = {
  id: string;
  vehicleId: string;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  quantity: number;
  unitPrice: MoneyValue;
  purchasedAt: string | null;
  supplier: string | null;
  installedAt: string | null;
  installedMileage: number | null;
  status: 'PURCHASED' | 'IN_STOCK' | 'INSTALLED' | 'REMOVED' | 'RETURNED' | 'RETIRED';
  notes: string | null;
  isErroneous: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceRecord = OsagoRecord | MaintenanceRecord | TireSet | VehicleBattery | DetailingRecord | VehiclePart;

export type OperationEvent = {
  id: string;
  vehicleId: string;
  type: 'CREATED' | 'INSTALLED' | 'REMOVED' | 'SEASONAL_CHANGE' | 'STORED' | 'SOLD' | 'RETIRED' | 'RETURNED' | 'WORK_COMPLETED' | 'STATUS_CHANGED' | 'MILEAGE_RECORDED';
  sourceEntity: string;
  sourceId: string;
  occurredAt: string;
  description: string;
  mileage: number | null;
  reason: string | null;
  comment: string | null;
};

export type GlobalEvent = {
  id: string;
  vehicle: { id: string; name: string; licensePlate: string };
  kind: string;
  section: RecordKind;
  title: string;
  dueAt: string | null;
  daysRemaining: number | null;
  remainingMileage: number | null;
  severity: 'OVERDUE' | 'ATTENTION' | 'UPCOMING';
};

export type Admin = {
  id: string;
  login: string;
  displayName: string;
  role: 'ADMIN';
  mustChangePassword: boolean;
};

export type LoginResponse = {
  token: string;
  expiresAt: string;
  mustChangePassword: boolean;
  admin: Omit<Admin, 'mustChangePassword'>;
};

export type ApiErrorBody = { message?: string | string[]; error?: string; statusCode?: number };

export type ServiceRecordMap = {
  osago: OsagoRecord;
  maintenance: MaintenanceRecord;
  tires: TireSet;
  batteries: VehicleBattery;
  detailing: DetailingRecord;
  parts: VehiclePart;
};
