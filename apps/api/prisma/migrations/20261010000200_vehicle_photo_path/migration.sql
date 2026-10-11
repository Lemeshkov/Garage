-- Adds a server-relative vehicle photo reference. This migration has NOT been applied.
ALTER TABLE "Vehicle" ADD COLUMN "photoPath" TEXT;
