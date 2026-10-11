import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsModule } from '../uploads/uploads.module';
import { LocalDevWriteGuard } from './local-dev-write.guard';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({ imports: [UploadsModule], controllers: [VehiclesController], providers: [VehiclesService, PrismaService, LocalDevWriteGuard] })
export class VehiclesModule {}
