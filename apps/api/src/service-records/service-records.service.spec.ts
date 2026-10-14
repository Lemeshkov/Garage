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

test('requires either a date or mileage for the next maintenance schedule', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'ACTIVE' }) }, maintenanceSchedule: { findUnique: async () => null } } as unknown as PrismaService;
  const service = new ServiceRecordsService(prisma);
  await assert.rejects(() => service.createMaintenanceSchedule('vehicle-1', {}), BadRequestException);
});

test('emits and prioritizes overdue and approaching OSAGO/maintenance warnings', async () => {
  const vehicle = { id: 'vehicle-1', brand: 'BMW', model: 'X7', licensePlate: 'A001AA', currentMileage: 19_500 };
  const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);
  const prisma = {
    vehicleDocument: { findMany: async () => [{ id: 'policy', validUntil: inDays(14), vehicle }] },
    maintenanceSchedule: { findMany: async () => [{ id: 'schedule', dueAt: null, dueMileage: 19_000, mileageWarningThreshold: 1000, vehicle }] },
    vehicleBattery: { findMany: async () => [] }, detailingRecord: { findMany: async () => [] },
  } as unknown as PrismaService;
  const result = await new ServiceRecordsService(prisma).warnings();
  assert.equal(result.length, 2);
  assert.equal(result[0].severity, 'OVERDUE');
  assert.equal(result[0].kind, 'MAINTENANCE');
  assert.equal(result[1].kind, 'OSAGO');
});
