-- Prepared only. This migration is additive and preserves all existing rows.
-- Do not apply without explicit confirmation.
ALTER TABLE "Vehicle" ALTER COLUMN "year" DROP NOT NULL;
