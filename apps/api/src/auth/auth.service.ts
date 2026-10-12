import { Injectable, HttpException, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { hash, verify, argon2id } from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AdminPrincipal } from './auth.types';

const maxAttempts = 5;
const attemptWindowMs = 15 * 60 * 1000;
const sessionDurationMs = 12 * 60 * 60 * 1000;
const configuredPasswordLength = Number(process.env.AUTH_MIN_PASSWORD_LENGTH ?? (process.env.NODE_ENV === 'production' ? 10 : 4));
const minimumPasswordLength = Number.isInteger(configuredPasswordLength) && configuredPasswordLength >= 4 ? configuredPasswordLength : 10;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  private tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private normalize(login: string) { return login.trim().toLowerCase(); }

  async login(loginValue: string, password: string, ipAddress?: string, userAgent?: string) {
    const login = this.normalize(loginValue); if (!login || !password) throw new UnauthorizedException('Неверный логин или пароль.');
    const since = new Date(Date.now() - attemptWindowMs);
    const recentFailures = await this.prisma.adminLoginAttempt.count({ where: { attemptedAt: { gte: since }, succeeded: false, OR: [{ login }, ...(ipAddress ? [{ ipAddress }] : [])] } });
    if (recentFailures >= maxAttempts) throw new HttpException('Слишком много попыток входа. Повторите позже.', HttpStatus.TOO_MANY_REQUESTS);
    const user = await this.prisma.adminUser.findUnique({ where: { login } });
    if (user?.lockedUntil && user.lockedUntil > new Date()) throw new HttpException('Вход временно заблокирован.', HttpStatus.TOO_MANY_REQUESTS);
    const valid = user?.isActive ? await verify(user.passwordHash, password).catch(() => false) : (await hash(password, { type: argon2id }), false);
    await this.prisma.adminLoginAttempt.create({ data: { login, ipAddress: ipAddress || null, succeeded: Boolean(valid) } });
    if (!user || !valid) {
      if (user) { const attempts = user.failedLoginAttempts + 1; await this.prisma.adminUser.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts, lockedUntil: attempts >= maxAttempts ? new Date(Date.now() + attemptWindowMs) : null } }); }
      throw new UnauthorizedException('Неверный логин или пароль.');
    }
    const token = randomBytes(32).toString('base64url'); const expiresAt = new Date(Date.now() + sessionDurationMs);
    const session = await this.prisma.$transaction(async tx => { await tx.adminUser.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } }); return tx.adminSession.create({ data: { adminUserId: user.id, tokenHash: this.tokenHash(token), expiresAt, ipAddress: ipAddress || null, userAgent: userAgent || null } }); });
    return { token, expiresAt, mustChangePassword: user.mustChangePassword, admin: { id: user.id, login: user.login, displayName: user.displayName, role: user.role } };
  }
  async authenticate(token: string): Promise<AdminPrincipal> {
    const session = await this.prisma.adminSession.findUnique({ where: { tokenHash: this.tokenHash(token) }, include: { adminUser: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.adminUser.isActive) throw new UnauthorizedException('Сессия недействительна или истекла.');
    await this.prisma.adminSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
    return { id: session.adminUser.id, login: session.adminUser.login, displayName: session.adminUser.displayName, role: session.adminUser.role, sessionId: session.id, mustChangePassword: session.adminUser.mustChangePassword };
  }
  async logout(sessionId: string) { await this.prisma.adminSession.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } }); return { loggedOut: true }; }
  async changePassword(adminId: string, sessionId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < minimumPasswordLength) throw new BadRequestException(`Новый пароль должен содержать не менее ${minimumPasswordLength} символов.`);
    if (currentPassword === newPassword) throw new BadRequestException('Новый пароль должен отличаться от текущего.');
    const user = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: adminId } });
    if (!await verify(user.passwordHash, currentPassword).catch(() => false)) throw new UnauthorizedException('Текущий пароль указан неверно.');
    const passwordHash = await hash(newPassword, { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    await this.prisma.$transaction(async tx => { await tx.adminUser.update({ where: { id: adminId }, data: { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null } }); await tx.adminSession.updateMany({ where: { adminUserId: adminId, id: { not: sessionId }, revokedAt: null }, data: { revokedAt: new Date() } }); });
    return { passwordChanged: true };
  }
}

