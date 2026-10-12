import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './auth.types';
import { AdminActorContext } from './admin-actor.context';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly actor: AdminActorContext) {}
  async canActivate(context: ExecutionContext) { const request = context.switchToHttp().getRequest<AuthenticatedRequest>(); const header = request.headers.authorization; const value = Array.isArray(header) ? header[0] : header; const token = value?.startsWith('Bearer ') ? value.slice(7).trim() : ''; if (!token) throw new UnauthorizedException('Требуется вход администратора.'); request.admin = await this.auth.authenticate(token); this.actor.set(request.admin); return true; }
}

@Injectable()
export class AdminWriteGuard extends AdminSessionGuard {
  constructor(auth: AuthService, actor: AdminActorContext) { super(auth, actor); }
  async canActivate(context: ExecutionContext) { await super.canActivate(context); const request = context.switchToHttp().getRequest<AuthenticatedRequest>(); if (request.admin?.mustChangePassword) throw new ForbiddenException('Перед изменением данных необходимо сменить первоначальный пароль.'); return true; }
}

