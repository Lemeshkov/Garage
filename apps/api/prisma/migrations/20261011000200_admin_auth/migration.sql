CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminLoginAttempt" (
  "id" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "ipAddress" TEXT,
  "succeeded" BOOLEAN NOT NULL,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditLog" ADD COLUMN "adminUserId" TEXT;
ALTER TABLE "OperationEvent" ADD COLUMN "initiatedByAdminId" TEXT;

CREATE UNIQUE INDEX "AdminUser_login_key" ON "AdminUser"("login");
CREATE INDEX "AdminUser_isActive_idx" ON "AdminUser"("isActive");
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_adminUserId_revokedAt_expiresAt_idx" ON "AdminSession"("adminUserId", "revokedAt", "expiresAt");
CREATE INDEX "AdminLoginAttempt_login_attemptedAt_idx" ON "AdminLoginAttempt"("login", "attemptedAt");
CREATE INDEX "AdminLoginAttempt_ipAddress_attemptedAt_idx" ON "AdminLoginAttempt"("ipAddress", "attemptedAt");
CREATE INDEX "AuditLog_adminUserId_changedAt_idx" ON "AuditLog"("adminUserId", "changedAt");
CREATE INDEX "OperationEvent_initiatedByAdminId_idx" ON "OperationEvent"("initiatedByAdminId");

ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationEvent" ADD CONSTRAINT "OperationEvent_initiatedByAdminId_fkey" FOREIGN KEY ("initiatedByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
