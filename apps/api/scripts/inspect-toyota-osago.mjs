import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const vehicles = await prisma.vehicle.findMany({
    where: { brand: { equals: 'Toyota', mode: 'insensitive' }, model: { contains: 'Land Cruiser', mode: 'insensitive' } },
    select: { id: true, brand: true, model: true, vin: true },
  });
  for (const vehicle of vehicles) {
    const documents = await prisma.vehicleDocument.findMany({ where: { vehicleId: vehicle.id, type: 'OSAGO' }, orderBy: { createdAt: 'asc' } });
    const documentIds = documents.map(({ id }) => id);
    const audits = documentIds.length ? await prisma.auditLog.findMany({ where: { entityType: 'VehicleDocument', entityId: { in: documentIds } }, include: { adminUser: { select: { login: true } } }, orderBy: { changedAt: 'asc' } }) : [];
    console.log(JSON.stringify({ vehicle, documents, audits: audits.map(({ id, entityId, action, oldValues, newValues, changedAt, correctionReason, adminUserId, adminUser }) => ({ id, entityId, action, oldValues, newValues, changedAt, correctionReason, adminUserId, adminLogin: adminUser?.login ?? null })) }, null, 2));
  }
} finally {
  await prisma.$disconnect();
}
