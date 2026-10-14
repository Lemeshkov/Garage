-- Additive ОСАГО/ТО extension. Existing records and identifiers are preserved.
BEGIN;

ALTER TABLE "MaintenanceRecord"
  ADD COLUMN "serviceType" TEXT,
  ADD COLUMN "replacedItems" TEXT,
  ADD COLUMN "cost" DECIMAL(12,2),
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "comment" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MaintenanceSchedule"
  ADD COLUMN "mileageWarningThreshold" INTEGER NOT NULL DEFAULT 1000;

ALTER TABLE "VehicleDocument"
  ADD COLUMN "insurer" TEXT,
  ADD COLUMN "policyNumber" TEXT,
  ADD COLUMN "validFrom" TIMESTAMP(3),
  ADD COLUMN "cost" DECIMAL(12,2),
  ADD COLUMN "comment" TEXT,
  ADD COLUMN "attachmentPath" TEXT;

ALTER TABLE "VehicleDocument" DROP CONSTRAINT "VehicleDocument_vehicleId_type_key";
CREATE INDEX "VehicleDocument_vehicleId_type_idx" ON "VehicleDocument"("vehicleId", "type");

COMMIT;
