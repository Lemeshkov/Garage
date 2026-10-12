import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { VehiclesService } from './vehicles.service';

test('returns 404 while requesting an absent vehicle', async () => {
  const prisma = { vehicle: { findUnique: async () => null } } as unknown as PrismaService;
  const service = new VehiclesService(prisma, {} as UploadsService);
  await assert.rejects(() => service.findOne('absent'), NotFoundException);
});

test('does not reactivate a sold vehicle', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'SOLD', mileageHistory: [] }) } } as unknown as PrismaService;
  const service = new VehiclesService(prisma, {} as UploadsService);
  await assert.rejects(() => service.changeStatus('vehicle-1', { status: 'ACTIVE' }), BadRequestException);
});

test('does not add mileage to an archived vehicle', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'WRITTEN_OFF', mileageHistory: [] }) } } as unknown as PrismaService;
  const service = new VehiclesService(prisma, {} as UploadsService);
  await assert.rejects(() => service.addMileage('vehicle-1', { value: 100 }), BadRequestException);
});

test('requires a reason when correcting an archived vehicle', async () => {
  const prisma = { vehicle: { findUnique: async () => ({ id: 'vehicle-1', status: 'SOLD', mileageHistory: [] }) } } as unknown as PrismaService;
  const service = new VehiclesService(prisma, {} as UploadsService);
  await assert.rejects(() => service.update('vehicle-1', { description: 'Исправление' }), BadRequestException);
});

test('selling a vehicle only changes status and appends journals', async () => {
  const old = { id: 'vehicle-1', status: 'ACTIVE', photoPath: 'vehicles/photo.jpg', mileageHistory: [] };
  let updateData: Record<string, unknown> | undefined; let events = 0; let audits = 0;
  const tx = { vehicle: { update: async (args: { data: Record<string, unknown> }) => { updateData = args.data; return { ...old, ...args.data }; } }, operationEvent: { create: async () => { events++; } }, auditLog: { create: async () => { audits++; } } };
  const prisma = { vehicle: { findUnique: async () => old }, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaService;
  const service = new VehiclesService(prisma, {} as UploadsService);
  const sold = await service.changeStatus('vehicle-1', { status: 'SOLD', reason: 'Продажа' });
  assert.equal(sold.photoPath, old.photoPath); assert.equal(updateData?.status, 'SOLD'); assert.equal(events, 1); assert.equal(audits, 1);
});
