import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { AdminPrincipal } from './auth.types';

type ActorStore = { admin?: AdminPrincipal };

@Injectable()
export class AdminActorContext {
  private readonly storage = new AsyncLocalStorage<ActorStore>();
  run(next: () => void) { this.storage.run({}, next); }
  set(admin: AdminPrincipal) { const store = this.storage.getStore(); if (store) store.admin = admin; }
  current() { return this.storage.getStore()?.admin; }
  auditFields() { const id = this.current()?.id; return id ? { adminUserId: id, changedBy: id } : {}; }
  eventFields() { const id = this.current()?.id; return id ? { initiatedByAdminId: id, initiatedBy: id } : {}; }
}

@Injectable()
export class AdminActorMiddleware implements NestMiddleware {
  constructor(private readonly actor: AdminActorContext) {}
  use(_req: unknown, _res: unknown, next: () => void) { this.actor.run(next); }
}
