import { PrismaClient } from '@prisma/client';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();
try {
  const [vehicles, photoRecords, mileageEntries, maintenanceRecords, admins] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.findMany({ where: { photoPath: { not: null } }, select: { photoPath: true } }),
    prisma.mileageEntry.count(),
    prisma.maintenanceRecord.count(),
    prisma.adminUser.findMany({ select: { login: true, role: true, isActive: true }, orderBy: { login: 'asc' } }),
  ]);
  const uploads = resolve(process.cwd(), 'apps', 'api', 'data', 'uploads');
  const photoFilesPresent = photoRecords.filter(({ photoPath }) => photoPath && existsSync(resolve(uploads, photoPath))).length;
  console.log(JSON.stringify({ vehicles, photoReferences: photoRecords.length, photoFilesPresent, mileageEntries, maintenanceRecords, admins }, null, 2));
} finally {
  await prisma.$disconnect();
}
