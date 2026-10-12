import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminSessionGuard, AdminWriteGuard } from './admin-session.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminActorContext, AdminActorMiddleware } from './admin-actor.context';

@Module({ controllers: [AuthController], providers: [AuthService, AdminSessionGuard, AdminWriteGuard, AdminActorContext, AdminActorMiddleware, PrismaService], exports: [AuthService, AdminSessionGuard, AdminWriteGuard, AdminActorContext, AdminActorMiddleware] })
export class AuthModule {}
