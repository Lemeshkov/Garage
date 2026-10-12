import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from './health.controller';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ServiceRecordsModule } from './service-records/service-records.module';
import { AuthModule } from './auth/auth.module';
import { AdminActorMiddleware } from './auth/admin-actor.context';

@Module({ imports: [AuthModule, VehiclesModule, ServiceRecordsModule], controllers: [HealthController] })
export class AppModule implements NestModule { configure(consumer: MiddlewareConsumer) { consumer.apply(AdminActorMiddleware).forRoutes('*'); } }
