-- Prepared only. Do not apply without confirmation.
CREATE TYPE "VehicleDocumentType" AS ENUM ('OSAGO', 'TECHNICAL_INSPECTION');
ALTER TABLE "Vehicle" ALTER COLUMN "currentMileage" DROP NOT NULL;
CREATE TABLE "MaintenanceRecord" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL,
  "mileage" INTEGER,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MaintenanceRecord_vehicleId_performedAt_idx" ON "MaintenanceRecord"("vehicleId", "performedAt");
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "MaintenanceSchedule" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "dueMileage" INTEGER,
  "warning" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenanceSchedule_vehicleId_key" UNIQUE ("vehicleId")
);
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "VehicleDocument" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "type" "VehicleDocumentType" NOT NULL,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleDocument_vehicleId_type_key" UNIQUE ("vehicleId", "type")
);
CREATE INDEX "VehicleDocument_type_validUntil_idx" ON "VehicleDocument"("type", "validUntil");
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
