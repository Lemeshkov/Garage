import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuthService } from './auth.service';
import { hash, verify } from 'argon2';

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

test('voluntary password change rejects values shorter than four characters', async () => {
  await assert.rejects(() => new AuthService({} as any).changePassword('a','s','old','123'), /не менее 4 символов/);
});

test('voluntary password change accepts four characters, replaces the hash and revokes other sessions', async () => {
  const oldHash=await hash('old-password');let updatedHash='';let revokedWhere:unknown;
  const tx={adminUser:{update:async({data}:any)=>{updatedHash=data.passwordHash}},adminSession:{updateMany:async({where}:any)=>{revokedWhere=where}}};
  const prisma={adminUser:{findUniqueOrThrow:async()=>({passwordHash:oldHash})},$transaction:async(callback:any)=>callback(tx)} as any;
  assert.deepEqual(await new AuthService(prisma).changePassword('admin-1','session-1','old-password','7591'),{passwordChanged:true});
  assert.equal(await verify(updatedHash,'7591'),true);
  assert.equal(await verify(updatedHash,'old-password'),false);
  assert.deepEqual(revokedWhere,{adminUserId:'admin-1',id:{not:'session-1'},revokedAt:null});
});
