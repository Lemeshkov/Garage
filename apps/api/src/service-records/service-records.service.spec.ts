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
