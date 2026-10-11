import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { VehiclesService } from './vehicles.service';

test('returns 404 while requesting an absent vehicle', async () => {
  const prisma = { vehicle: { findUnique: async () => null } } as unknown as PrismaService;
  const service = new VehiclesService(prisma, {} as UploadsService);
  await assert.rejects(() => service.findOne('absent'), NotFoundException);
});
