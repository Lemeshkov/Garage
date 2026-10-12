import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminActorContext } from './admin-actor.context';
import { AdminSessionGuard, AdminWriteGuard } from './admin-session.guard';

function context(authorization?: string) {
  const request = { headers: authorization ? { authorization } : {} } as any;
  return { request, execution: { switchToHttp: () => ({ getRequest: () => request }) } as any };
}

test('guest cannot write even when LOCAL_DEV_WRITE is true', async () => {
  const old = process.env.LOCAL_DEV_WRITE;
  process.env.LOCAL_DEV_WRITE = 'true';
  const guard = new AdminWriteGuard({ authenticate: async () => { throw new Error('must not run'); } } as any, new AdminActorContext());
  await assert.rejects(() => guard.canActivate(context().execution), UnauthorizedException);
  if (old === undefined) delete process.env.LOCAL_DEV_WRITE; else process.env.LOCAL_DEV_WRITE = old;
});

test('valid admin session permits writes and supplies audit actor', async () => {
  const actor = new AdminActorContext();
  const principal = { id: 'admin-1', login: 'admin', displayName: 'Admin', role: 'ADMIN' as const, sessionId: 'session-1', mustChangePassword: false };
  await new Promise<void>((resolve, reject) => actor.run(() => {
    const guard = new AdminWriteGuard({ authenticate: async () => principal } as any, actor);
    guard.canActivate(context('Bearer opaque-token').execution).then(() => {
      assert.deepEqual(actor.auditFields(), { adminUserId: 'admin-1', changedBy: 'admin-1' });
      resolve();
    }, reject);
  }));
});

test('forced password change blocks mutations but permits session inspection', async () => {
  const principal = { id: 'admin-1', login: 'admin', displayName: 'Admin', role: 'ADMIN' as const, sessionId: 'session-1', mustChangePassword: true };
  const auth = { authenticate: async () => principal } as any;
  const actor = new AdminActorContext();
  await assert.doesNotReject(() => new AdminSessionGuard(auth, actor).canActivate(context('Bearer token').execution));
  await assert.rejects(() => new AdminWriteGuard(auth, actor).canActivate(context('Bearer token').execution), ForbiddenException);
});
