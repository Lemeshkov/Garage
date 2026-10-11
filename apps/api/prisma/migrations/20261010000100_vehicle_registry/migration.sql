-- Created for the vehicle registry stage. This file has NOT been applied.
CREATE TYPE "VehicleGroup" AS ENUM ('IE', 'VE', 'OTHER');
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'ATV', 'OTHER');

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL,
  "group" "VehicleGroup" NOT NULL,
  "type" "VehicleType" NOT NULL,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "licensePlate" TEXT NOT NULL,
  "vin" TEXT NOT NULL,
  "currentMileage" INTEGER NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Vehicle_group_idx" ON "Vehicle"("group");
CREATE INDEX "Vehicle_licensePlate_idx" ON "Vehicle"("licensePlate");
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");

CREATE TABLE "MileageEntry" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "comment" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MileageEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MileageEntry_vehicleId_recordedAt_idx" ON "MileageEntry"("vehicleId", "recordedAt");
ALTER TABLE "MileageEntry" ADD CONSTRAINT "MileageEntry_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
