import * as assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { UploadsService } from './uploads.service';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const file = (buffer: Buffer): Express.Multer.File => ({ buffer, size: buffer.length } as Express.Multer.File);

test('saves a JPEG with a generated server-relative name', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'garage-upload-'));
  const service = new UploadsService();
  Object.defineProperty(service, 'directory', { value: directory });
  try { const path = await service.saveVehiclePhoto(file(jpeg)); assert.match(path, /^vehicles\/[a-f0-9-]+\.jpg$/); } finally { await rm(directory, { recursive: true, force: true }); }
});

test('rejects a file without a supported image signature', async () => {
  const service = new UploadsService();
  await assert.rejects(() => service.saveVehiclePhoto(file(Buffer.from('not an image'))));
});
