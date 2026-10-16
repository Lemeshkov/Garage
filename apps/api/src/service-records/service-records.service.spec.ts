import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRecordsService } from './service-records.service';

test('keeps unknown optional battery values as null and appends audit/event records', async () => {
  let data: Record<string, unknown> | undefined; let audits = 0; let events = 0;
  const tx = {
    vehicleBattery: { create: async (args: { data: Record<string, unknown> }) => { data = args.data; return { id: 'battery-1', createdAt: new Date(), ...args.data }; } },
    auditLog: { create: async () => { audits++; } }, operationEvent: { create: async () => { events++; } },
  };
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1' }) }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await service.createBattery('vehicle-1', { brand: 'Varta', model: 'AGM' });
  assert.equal(data?.capacityAh, null); assert.equal(data?.price, null); assert.equal(data?.installedMileage, null); assert.equal(audits, 1); assert.equal(events, 1);
});

test('rejects a status change for a record owned by another vehicle', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, vehiclePart: { findFirst: async () => null } } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await assert.rejects(() => service.changeStatus('parts', 'vehicle-1', 'foreign-part', { status: 'INSTALLED' }), NotFoundException);
});

test('rejects terminal status transitions', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, vehiclePart: { findFirst: async () => ({ id: 'part-1', vehicleId: 'vehicle-1', status: 'RETIRED' }) } } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await assert.rejects(() => service.changeStatus('parts', 'vehicle-1', 'part-1', { status: 'INSTALLED' }), BadRequestException);
});

test('rejects zero quantity before writing a part', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1' }) } } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await assert.rejects(() => service.createPart('vehicle-1', { name: 'Фильтр', quantity: 0, unitPrice: '-1', status: 'PURCHASED' }), BadRequestException);
});

test('rejects new operations for a sold vehicle', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'SOLD' }) } } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await assert.rejects(() => service.createPart('vehicle-1', { name: 'Фильтр', quantity: 1, status: 'PURCHASED' }), BadRequestException);
});

test('marks a record erroneous without deleting it and invalidates its events', async () => {
  let updated = false; let eventsInvalidated = false; let auditAction = '';
  const old = { id: 'part-1', vehicleId: 'vehicle-1', name: 'Фильтр', status: 'PURCHASED', isErroneous: false };
  const tx = {
    vehiclePart: { update: async () => { updated = true; return { ...old, isErroneous: true }; } },
    operationEvent: { updateMany: async () => { eventsInvalidated = true; } },
    auditLog: { create: async (args: { data: { action: string } }) => { auditAction = args.data.action; } },
  };
  const prisma = { vehiclePart: { findFirst: async () => old }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await service.markErroneous('parts', 'vehicle-1', 'part-1', { reason: 'Дублирующая запись' });
  assert.equal(updated, true); assert.equal(eventsInvalidated, true); assert.equal(auditAction, 'MARK_ERRONEOUS');
});

test('field correction writes audit but not an operation event', async () => {
  let audits = 0;
  const old = { id: 'part-1', vehicleId: 'vehicle-1', name: 'Фильтр', quantity: 1, status: 'PURCHASED', isErroneous: false };
  const tx = { vehiclePart: { update: async (args: { data: object }) => ({ ...old, ...args.data }) }, auditLog: { create: async () => { audits++; } } };
  const prisma = { vehiclePart: { findFirst: async () => old }, vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await service.updatePart('vehicle-1', 'part-1', { name: 'Масляный фильтр' });
  assert.equal(audits, 1);
});

test('rejects an OSAGO policy whose end date precedes its start date', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) } } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await assert.rejects(() => service.createOsago('vehicle-1', { insurer: 'Страховая', policyNumber: '123', validFrom: '2026-10-10', validUntil: '2026-10-09' }), BadRequestException);
});

test('creates OSAGO with only the issue date and no expiry warning data', async () => {
  let saved: Record<string, unknown> | undefined;
  const tx = {
    vehicleDocument: { create: async (args: { data: Record<string, unknown> }) => { saved = args.data; return { id: 'policy-1', createdAt: new Date(), ...args.data }; } },
    auditLog: { create: async () => undefined }, operationEvent: { create: async () => undefined },
  };
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const result = await new ServiceRecordsService(prisma).createOsago('vehicle-1', { validFrom: '2026-10-16' });
  assert.equal(saved?.insurer, null); assert.equal(saved?.policyNumber, null); assert.equal(saved?.validUntil, null); assert.equal(saved?.status, 'ACTIVE'); assert.equal('isErroneous' in (saved ?? {}), false); assert.equal(result.daysRemaining, null);
});

test('treats a historically erroneous OSAGO as a regular policy without erasing audit data', async () => {
  const prisma = {
    vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) },
    vehicleDocument: { findMany: async () => [{ id: 'policy-1', validUntil: null, status: 'ACTIVE', isErroneous: true, erroneousReason: 'Подтверждено администратором' }] },
  } as unknown as PrismaService;
  const records = await new ServiceRecordsService(prisma).listOsago('vehicle-1');
  assert.equal('isErroneous' in records[0], false); assert.equal('erroneousReason' in records[0], false); assert.equal(records[0].calculatedStatus, 'ACTIVE');
});

test('calculates active and expired OSAGO status without changing error state', async () => {
  const tomorrow = new Date(Date.now() + 86_400_000); const yesterday = new Date(Date.now() - 86_400_000);
  const prisma = {
    vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) },
    vehicleDocument: { findMany: async () => [{ id: 'active', validUntil: tomorrow, isErroneous: false }, { id: 'expired', validUntil: yesterday, isErroneous: false }] },
  } as unknown as PrismaService;
  const records = await new ServiceRecordsService(prisma).listOsago('vehicle-1');
  assert.equal(records[0].calculatedStatus, 'EXPIRING_SOON'); assert.equal(records[1].calculatedStatus, 'EXPIRED');
});

test('edits an existing OSAGO and preserves an audit entry', async () => {
  let audited = false;
  const old = { id: 'policy-1', vehicleId: 'vehicle-1', type: 'OSAGO', validFrom: new Date('2026-01-01'), validUntil: null, insurer: null, policyNumber: null, cost: null, comment: null, isErroneous: true };
  const tx = { vehicleDocument: { update: async (args: { data: object }) => ({ ...old, ...args.data }) }, auditLog: { create: async () => { audited = true; } } };
  const prisma = { vehicleDocument: { findFirst: async () => old }, vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const result = await new ServiceRecordsService(prisma).updateOsago('vehicle-1', 'policy-1', { policyNumber: 'XXX-123' });
  assert.equal(result.policyNumber, 'XXX-123'); assert.equal('isErroneous' in result, false); assert.equal(audited, true);
});

test('cannot mark OSAGO erroneous through the generic document route', async () => {
  const prisma = { vehicleDocument: { findFirst: async () => ({ id: 'policy-1', vehicleId: 'vehicle-1', type: 'OSAGO', isErroneous: false }) } } as unknown as PrismaService;
  await assert.rejects(() => new ServiceRecordsService(prisma).markExistingErroneous('documents', 'vehicle-1', 'policy-1', { reason: 'Не используется для ОСАГО' }), BadRequestException);
});

test('creates maintenance with separate audit and operation event records', async () => {
  let audits = 0; let events = 0;
  const tx = {
    maintenanceRecord: { create: async (args: { data: Record<string, unknown> }) => ({ id: 'maintenance-1', ...args.data }) },
    auditLog: { create: async () => { audits++; } },
    operationEvent: { create: async () => { events++; } },
  };
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await service.createMaintenance('vehicle-1', { serviceType: 'Замена масла', performedAt: '2026-10-10', mileage: 15000 });
  assert.equal(audits, 1); assert.equal(events, 1);
});

test('creates maintenance with only the performed date', async () => {
  let saved: Record<string, unknown> | undefined;
  const tx = {
    maintenanceRecord: { create: async (args: { data: Record<string, unknown> }) => { saved = args.data; return { id: 'maintenance-1', ...args.data }; } },
    auditLog: { create: async () => undefined }, operationEvent: { create: async () => undefined },
  };
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  await new ServiceRecordsService(prisma).createMaintenance('vehicle-1', { performedAt: '2026-10-16' });
  assert.equal(saved?.mileage, null); assert.equal(saved?.serviceType, null); assert.equal(saved?.cost, null);
});

test('requires either a date or mileage for the next maintenance schedule', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, maintenanceSchedule: { findUnique: async () => null } } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await assert.rejects(() => service.createMaintenanceSchedule('vehicle-1', {}), BadRequestException);
});

test('emits and prioritizes overdue and approaching OSAGO/maintenance warnings', async () => {
  const vehicle = { id: 'vehicle-1', brand: 'BMW', model: 'X7', licensePlate: 'A001AA', currentMileage: 19_500 };
  const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);
  let osagoWhere: Record<string, unknown> | undefined;
  const prisma = {
    vehicleDocument: { findMany: async (args: { where: Record<string, unknown> }) => { osagoWhere = args.where; return [{ id: 'policy', validUntil: inDays(14), isErroneous: true, vehicle }]; } },
    maintenanceSchedule: { findMany: async () => [{ id: 'schedule', dueAt: null, dueMileage: 19_000, mileageWarningThreshold: 1000, vehicle }] },
    vehicleBattery: { findMany: async () => [] }, detailingRecord: { findMany: async () => [] },
  } as unknown as PrismaService;
  const result = await new ServiceRecordsService(prisma).warnings();
  assert.equal(result.length, 2);
  assert.equal(result[0].severity, 'OVERDUE');
  assert.equal(result[0].kind, 'MAINTENANCE');
  assert.equal(result[1].kind, 'OSAGO');
  assert.equal('isErroneous' in (osagoWhere ?? {}), false);
});
