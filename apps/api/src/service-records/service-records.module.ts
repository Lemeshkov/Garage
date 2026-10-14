import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ServiceRecordsController } from './service-records.controller';
import { ServiceRecordsService } from './service-records.service';
import { UploadsModule } from '../uploads/uploads.module';
import { EventsController } from './events.controller';

@Module({ imports: [AuthModule, UploadsModule], controllers: [ServiceRecordsController, EventsController], providers: [ServiceRecordsService, PrismaService] })
export class ServiceRecordsModule {}

