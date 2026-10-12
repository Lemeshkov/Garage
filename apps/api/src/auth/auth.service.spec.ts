import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuthService } from './auth.service';

test('logout revokes only the current active session', async () => {
  let where: unknown; let data: unknown;
  const prisma = { adminSession: { updateMany: async (args: any) => { where = args.where; data = args.data; return { count: 1 }; } } } as any;
  assert.deepEqual(await new AuthService(prisma).logout('session-1'), { loggedOut: true });
  assert.deepEqual(where, { id: 'session-1', revokedAt: null });
  assert.ok((data as any).revokedAt instanceof Date);
});

test('authentication rejects revoked sessions', async () => {
  const prisma = { adminSession: { findUnique: async () => ({ id: 's', revokedAt: new Date(), expiresAt: new Date(Date.now()+10000), adminUser: { isActive: true } }) } } as any;
  await assert.rejects(() => new AuthService(prisma).authenticate('token'));
});
