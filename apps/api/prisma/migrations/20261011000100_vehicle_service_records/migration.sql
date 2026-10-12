-- This migration is additive and intentionally contains no DELETE, DROP TABLE or table recreation.
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'STORED', 'SOLD', 'WRITTEN_OFF');
CREATE TYPE "TireSeason" AS ENUM ('SUMMER', 'WINTER', 'ALL_SEASON');
CREATE TYPE "TireSetStatus" AS ENUM ('INSTALLED', 'STORED', 'REMOVED', 'SOLD', 'RETIRED');
CREATE TYPE "TireChangeAction" AS ENUM ('INSTALLED', 'REMOVED');
CREATE TYPE "BatteryStatus" AS ENUM ('IN_STOCK', 'INSTALLED', 'REMOVED', 'RETIRED');
CREATE TYPE "VehiclePartStatus" AS ENUM ('PURCHASED', 'IN_STOCK', 'INSTALLED', 'REMOVED', 'RETURNED', 'RETIRED');
CREATE TYPE "MaintenanceStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ScheduleStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'INACTIVE');
CREATE TYPE "DetailingStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED', 'INACTIVE');
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'CANCELLED');
CREATE TYPE "OperationEventType" AS ENUM ('CREATED', 'INSTALLED', 'REMOVED', 'SEASONAL_CHANGE', 'STORED', 'SOLD', 'RETIRED', 'RETURNED', 'WORK_COMPLETED', 'STATUS_CHANGED', 'MILEAGE_RECORDED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STATUS_CHANGE', 'MARK_ERRONEOUS');

ALTER TABLE "Vehicle"
  ADD COLUMN "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "statusComment" TEXT;

ALTER TABLE "MaintenanceRecord"
  ADD COLUMN "status" "MaintenanceStatus" NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "statusComment" TEXT,
  ADD COLUMN "isErroneous" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "erroneousAt" TIMESTAMP(3),
  ADD COLUMN "erroneousReason" TEXT;

ALTER TABLE "MaintenanceSchedule"
  ADD COLUMN "status" "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "statusComment" TEXT,
  ADD COLUMN "isErroneous" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "erroneousAt" TIMESTAMP(3),
  ADD COLUMN "erroneousReason" TEXT;

ALTER TABLE "VehicleDocument"
  ADD COLUMN "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "statusComment" TEXT,
  ADD COLUMN "isErroneous" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "erroneousAt" TIMESTAMP(3),
  ADD COLUMN "erroneousReason" TEXT;

ALTER TABLE "MileageEntry"
  ADD COLUMN "isErroneous" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "erroneousAt" TIMESTAMP(3),
  ADD COLUMN "erroneousReason" TEXT;

CREATE TABLE "TireSet" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "season" "TireSeason" NOT NULL,
  "brand" TEXT NOT NULL, "model" TEXT NOT NULL, "tireSize" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  "purchaseDate" TIMESTAMP(3), "purchasePrice" DECIMAL(12,2), "installedAt" TIMESTAMP(3),
  "installedMileage" INTEGER, "storageLocation" TEXT, "status" "TireSetStatus" NOT NULL,
  "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "statusReason" TEXT, "statusComment" TEXT,
  "isErroneous" BOOLEAN NOT NULL DEFAULT false, "erroneousAt" TIMESTAMP(3), "erroneousReason" TEXT,
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TireSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TireChangeHistory" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "tireSetId" TEXT NOT NULL,
  "action" "TireChangeAction" NOT NULL, "changedAt" TIMESTAMP(3) NOT NULL,
  "mileage" INTEGER, "notes" TEXT, "isErroneous" BOOLEAN NOT NULL DEFAULT false,
  "erroneousAt" TIMESTAMP(3), "erroneousReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TireChangeHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleBattery" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "brand" TEXT NOT NULL, "model" TEXT NOT NULL,
  "capacityAh" INTEGER, "purchaseDate" TIMESTAMP(3), "installedAt" TIMESTAMP(3), "installedMileage" INTEGER,
  "price" DECIMAL(12,2), "warrantyUntil" TIMESTAMP(3), "removedAt" TIMESTAMP(3),
  "replacementReason" TEXT, "notes" TEXT, "status" "BatteryStatus" NOT NULL DEFAULT 'IN_STOCK',
  "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "statusReason" TEXT, "statusComment" TEXT,
  "isErroneous" BOOLEAN NOT NULL DEFAULT false, "erroneousAt" TIMESTAMP(3), "erroneousReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleBattery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DetailingRecord" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "serviceType" TEXT NOT NULL, "performedAt" TIMESTAMP(3) NOT NULL,
  "provider" TEXT, "cost" DECIMAL(12,2), "description" TEXT, "protectionValidUntil" TIMESTAMP(3),
  "status" "DetailingStatus" NOT NULL DEFAULT 'COMPLETED', "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statusReason" TEXT, "statusComment" TEXT, "isErroneous" BOOLEAN NOT NULL DEFAULT false,
  "erroneousAt" TIMESTAMP(3), "erroneousReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "DetailingRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehiclePart" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "name" TEXT NOT NULL, "partNumber" TEXT,
  "manufacturer" TEXT, "quantity" INTEGER NOT NULL, "unitPrice" DECIMAL(12,2), "purchasedAt" TIMESTAMP(3),
  "supplier" TEXT, "installedAt" TIMESTAMP(3), "installedMileage" INTEGER, "status" "VehiclePartStatus" NOT NULL,
  "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "statusReason" TEXT, "statusComment" TEXT,
  "isErroneous" BOOLEAN NOT NULL DEFAULT false, "erroneousAt" TIMESTAMP(3), "erroneousReason" TEXT,
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehiclePart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationEvent" (
  "id" TEXT NOT NULL, "vehicleId" TEXT NOT NULL, "type" "OperationEventType" NOT NULL,
  "sourceEntity" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL, "mileage" INTEGER, "initiatedBy" TEXT, "reason" TEXT, "comment" TEXT,
  "isErroneous" BOOLEAN NOT NULL DEFAULT false, "erroneousAt" TIMESTAMP(3), "erroneousReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL, "vehicleId" TEXT, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL, "oldValues" JSONB, "newValues" JSONB,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "changedBy" TEXT, "correctionReason" TEXT,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TireSet_vehicleId_status_idx" ON "TireSet"("vehicleId", "status");
CREATE INDEX "TireChangeHistory_vehicleId_changedAt_idx" ON "TireChangeHistory"("vehicleId", "changedAt");
CREATE INDEX "TireChangeHistory_tireSetId_changedAt_idx" ON "TireChangeHistory"("tireSetId", "changedAt");
CREATE INDEX "VehicleBattery_vehicleId_installedAt_idx" ON "VehicleBattery"("vehicleId", "installedAt");
CREATE INDEX "DetailingRecord_vehicleId_performedAt_idx" ON "DetailingRecord"("vehicleId", "performedAt");
CREATE INDEX "VehiclePart_vehicleId_status_idx" ON "VehiclePart"("vehicleId", "status");
CREATE INDEX "VehiclePart_vehicleId_installedAt_idx" ON "VehiclePart"("vehicleId", "installedAt");
CREATE INDEX "OperationEvent_vehicleId_occurredAt_idx" ON "OperationEvent"("vehicleId", "occurredAt");
CREATE INDEX "OperationEvent_sourceEntity_sourceId_idx" ON "OperationEvent"("sourceEntity", "sourceId");
CREATE INDEX "OperationEvent_type_idx" ON "OperationEvent"("type");
CREATE INDEX "AuditLog_vehicleId_changedAt_idx" ON "AuditLog"("vehicleId", "changedAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

ALTER TABLE "TireSet" ADD CONSTRAINT "TireSet_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TireChangeHistory" ADD CONSTRAINT "TireChangeHistory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TireChangeHistory" ADD CONSTRAINT "TireChangeHistory_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleBattery" ADD CONSTRAINT "VehicleBattery_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DetailingRecord" ADD CONSTRAINT "DetailingRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehiclePart" ADD CONSTRAINT "VehiclePart_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationEvent" ADD CONSTRAINT "OperationEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaintenanceRecord" DROP CONSTRAINT "MaintenanceRecord_vehicleId_fkey";
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceSchedule" DROP CONSTRAINT "MaintenanceSchedule_vehicleId_fkey";
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleDocument" DROP CONSTRAINT "VehicleDocument_vehicleId_fkey";
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MileageEntry" DROP CONSTRAINT "MileageEntry_vehicleId_fkey";
ALTER TABLE "MileageEntry" ADD CONSTRAINT "MileageEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve discoverability of data that predates the immutable event journal.
INSERT INTO "OperationEvent" ("id", "vehicleId", "type", "sourceEntity", "sourceId", "occurredAt", "description", "mileage")
SELECT 'legacy-vehicle-' || v."id", v."id", 'CREATED', 'Vehicle', v."id", v."createdAt", 'Транспорт существовал до включения журнала', v."currentMileage" FROM "Vehicle" v;
INSERT INTO "OperationEvent" ("id", "vehicleId", "type", "sourceEntity", "sourceId", "occurredAt", "description", "mileage")
SELECT 'legacy-mileage-' || m."id", m."vehicleId", 'MILEAGE_RECORDED', 'MileageEntry', m."id", m."recordedAt", 'Историческая запись пробега', m."value" FROM "MileageEntry" m;
INSERT INTO "OperationEvent" ("id", "vehicleId", "type", "sourceEntity", "sourceId", "occurredAt", "description", "mileage")
SELECT 'legacy-maintenance-' || m."id", m."vehicleId", 'WORK_COMPLETED', 'MaintenanceRecord', m."id", m."performedAt", COALESCE(m."description", 'Историческая запись ТО'), m."mileage" FROM "MaintenanceRecord" m;
INSERT INTO "OperationEvent" ("id", "vehicleId", "type", "sourceEntity", "sourceId", "occurredAt", "description")
SELECT 'legacy-document-' || d."id", d."vehicleId", 'CREATED', 'VehicleDocument', d."id", d."createdAt", 'Историческая запись документа: ' || d."type"::text FROM "VehicleDocument" d;
INSERT INTO "OperationEvent" ("id", "vehicleId", "type", "sourceEntity", "sourceId", "occurredAt", "description", "mileage")
SELECT 'legacy-schedule-' || s."id", s."vehicleId", 'CREATED', 'MaintenanceSchedule', s."id", s."createdAt", COALESCE(s."warning", 'Исторический план обслуживания'), s."dueMileage" FROM "MaintenanceSchedule" s;

INSERT INTO "AuditLog" ("id", "vehicleId", "entityType", "entityId", "action", "newValues", "changedAt")
SELECT 'legacy-audit-vehicle-' || v."id", v."id", 'Vehicle', v."id", 'CREATE', to_jsonb(v), v."createdAt" FROM "Vehicle" v;
INSERT INTO "AuditLog" ("id", "vehicleId", "entityType", "entityId", "action", "newValues", "changedAt")
SELECT 'legacy-audit-mileage-' || m."id", m."vehicleId", 'MileageEntry', m."id", 'CREATE', to_jsonb(m), m."createdAt" FROM "MileageEntry" m;
INSERT INTO "AuditLog" ("id", "vehicleId", "entityType", "entityId", "action", "newValues", "changedAt")
SELECT 'legacy-audit-maintenance-' || m."id", m."vehicleId", 'MaintenanceRecord', m."id", 'CREATE', to_jsonb(m), m."createdAt" FROM "MaintenanceRecord" m;
INSERT INTO "AuditLog" ("id", "vehicleId", "entityType", "entityId", "action", "newValues", "changedAt")
SELECT 'legacy-audit-schedule-' || s."id", s."vehicleId", 'MaintenanceSchedule', s."id", 'CREATE', to_jsonb(s), s."createdAt" FROM "MaintenanceSchedule" s;
INSERT INTO "AuditLog" ("id", "vehicleId", "entityType", "entityId", "action", "newValues", "changedAt")
SELECT 'legacy-audit-document-' || d."id", d."vehicleId", 'VehicleDocument', d."id", 'CREATE', to_jsonb(d), d."createdAt" FROM "VehicleDocument" d;
