import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({ imports: [VehiclesModule], controllers: [HealthController] })
export class AppModule {}
