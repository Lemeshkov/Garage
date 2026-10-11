import { PrismaClient } from '@prisma/client';

const vehicles = [
  { brand: 'Bentley', model: 'Continental GT', sourceModel: 'Contonental GT', plate: 'О086ОО54', vin: 'SCBGE23W5CC075844', type: 'CAR', mileage: 24940, last: ['2026-07-13', 24500], next: ['2027-07-13', 31500], osago: '2027-03-24' },
  { brand: 'Toyota', model: 'Land Cruiser', plate: 'А070НМ142', vin: 'JTEEU73J2MF002578', type: 'CAR', mileage: 8065, last: ['2025-06-10', 2000], warning: 'Требуется ТО по времени', osago: '2026-11-18' },
  { brand: 'BMW', model: 'X7', plate: 'О078ОО54', vin: 'WBBACX610409D18144', type: 'CAR', mileage: 62254, last: ['2026-01-29', 60122], next: ['2027-01-29', 67122], osago: '2027-03-24' },
  { brand: 'Porsche', model: 'Panamera GTS', plate: 'О042ОО54', vin: 'WP0ZZZ97ZML194152', type: 'CAR', mileage: 19736, last: ['2025-11-17', 17500], next: ['2026-11-17', 24500], osago: '2027-09-03' },
  { brand: 'Porsche', model: 'Cayenne S', plate: 'А089АА93', vin: 'WP1ZZZ9YZKDA65180', type: 'CAR', mileage: 72793, last: ['2026-01-15', 61662], warning: 'Требуется ТО по пробегу' },
  { brand: 'Porsche', model: 'Cayenne GTS', plate: 'А100МР42', vin: 'WP1ZZZ9YZRDA81344', type: 'CAR', mileage: 17222, last: ['2026-09-28', 16790], next: ['2027-09-28', 23790] },
  { brand: 'Zeekr', model: '9X', plate: '0090ХХ42', vin: 'L6T795ND7SN133908', type: 'CAR', mileage: null, last: ['2026-08-20', null] },
  { brand: 'Triumph', model: 'Speedmaster', plate: '1101АО42', vin: 'SMTDAD82HYNAV3574', type: 'MOTORCYCLE', mileage: 2334, last: ['2026-04-07', 2000], next: ['2027-04-07', 9000], osago: '2027-06-09' },
  { brand: 'BMW', model: 'R 1300 GS', plate: '2859АО42', vin: 'WB10M2101R6J13087', type: 'MOTORCYCLE', mileage: 8523, last: ['2026-06-11', 7100], next: ['2027-06-11', 14100], osago: '2027-06-09' },
].map(item => ({ ...item, group: 'VE', year: null }));

const dryRun = process.argv.includes('--dry-run');
const database = new URL(process.env.DATABASE_URL).pathname.slice(1);
if (database !== 'garage_db') throw new Error(`Импорт разрешён только в garage_db; получено: ${database || '(пусто)'}`);
console.table(vehicles.map(v => ({ vin: v.vin, transport: `${v.brand} ${v.model}`, plate: v.plate, mileage: v.mileage ?? 'не указан', year: v.year ?? 'NULL (не указан)', warning: v.warning ?? '' })));
if (dryRun) { console.log('DRY-RUN: 9 записей спланированы; запись в БД и файловую систему не выполнялась. Неизвестные годы будут сохранены как NULL.'); process.exit(0); }
const prisma = new PrismaClient();
try {
  for (const v of vehicles) {
    const exists = await prisma.vehicle.findFirst({ where: { vin: v.vin } });
    if (exists) { console.log(`Пропуск ${v.vin}: уже существует, пользовательские данные не перезаписаны.`); continue; }
    await prisma.$transaction(async tx => {
      const created = await tx.vehicle.create({ data: { group: 'VE', type: v.type, brand: v.brand, model: v.model, year: v.year, licensePlate: v.plate, vin: v.vin, currentMileage: v.mileage } });
      if (v.last) await tx.maintenanceRecord.create({ data: { vehicleId: created.id, performedAt: new Date(v.last[0]), mileage: v.last[1], description: 'ТО из реестра В.Е.' } });
      if (v.next || v.warning) await tx.maintenanceSchedule.create({ data: { vehicleId: created.id, dueAt: v.next ? new Date(v.next[0]) : null, dueMileage: v.next?.[1] ?? null, warning: v.warning ?? null } });
      if (v.osago) await tx.vehicleDocument.create({ data: { vehicleId: created.id, type: 'OSAGO', validUntil: new Date(v.osago) } });
    });
  }
} finally { await prisma.$disconnect(); }
