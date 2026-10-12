import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ServiceRecordsController } from './service-records.controller';
import { ServiceRecordsService } from './service-records.service';

@Module({ imports: [AuthModule], controllers: [ServiceRecordsController], providers: [ServiceRecordsService, PrismaService] })
export class ServiceRecordsModule {}

