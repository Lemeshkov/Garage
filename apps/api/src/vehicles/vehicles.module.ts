import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsModule } from '../uploads/uploads.module';
import { AuthModule } from '../auth/auth.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({ imports: [UploadsModule, AuthModule], controllers: [VehiclesController], providers: [VehiclesService, PrismaService] })
export class VehiclesModule {}
