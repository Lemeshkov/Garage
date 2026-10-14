import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminWriteGuard } from '../auth/admin-session.guard';
import { ServiceRecordsService } from './service-records.service';
import { BatteryInput, DetailingInput, MaintenanceInput, MaintenanceScheduleInput, MarkErroneousInput, OsagoInput, PartInput, SeasonalTireChangeInput, StatusChangeInput, TireSetInput } from './service-record.types';

@Controller('vehicles/:vehicleId')
export class ServiceRecordsController {
  constructor(private readonly records: ServiceRecordsService) {}
  @Get('tires') listTires(@Param('vehicleId') v: string) { return this.records.listTires(v); }
  @Get('batteries') listBatteries(@Param('vehicleId') v: string) { return this.records.listBatteries(v); }
  @Get('detailing') listDetailing(@Param('vehicleId') v: string) { return this.records.listDetailing(v); }
  @Get('parts') listParts(@Param('vehicleId') v: string) { return this.records.listParts(v); }
  @Get('timeline') timeline(@Param('vehicleId') v: string, @Query('type') type?: string) { return this.records.timeline(v, type); }
  @Get('audit') @UseGuards(AdminWriteGuard) audit(@Param('vehicleId') v: string) { return this.records.audit(v); }
  @Get('osago') listOsago(@Param('vehicleId') v: string) { return this.records.listOsago(v); }
  @Post('osago') @UseGuards(AdminWriteGuard) createOsago(@Param('vehicleId') v: string, @Body() b: OsagoInput) { return this.records.createOsago(v, b); }
  @Patch('osago/:id') @UseGuards(AdminWriteGuard) updateOsago(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: Partial<OsagoInput>) { return this.records.updateOsago(v, id, b); }
  @Post('osago/:id/attachment') @UseGuards(AdminWriteGuard) @UseInterceptors(FileInterceptor('document', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } })) uploadOsago(@Param('vehicleId') v: string, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) { return this.records.attachOsago(v, id, file); }
  @Post('osago/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousOsago(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markOsagoErroneous(v, id, b); }

  @Get('maintenance') listMaintenance(@Param('vehicleId') v: string) { return this.records.listMaintenance(v); }
  @Post('maintenance') @UseGuards(AdminWriteGuard) createMaintenance(@Param('vehicleId') v: string, @Body() b: MaintenanceInput) { return this.records.createMaintenance(v, b); }
  @Patch('maintenance/:id') @UseGuards(AdminWriteGuard) updateMaintenance(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: Partial<MaintenanceInput>) { return this.records.updateMaintenance(v, id, b); }
  @Get('maintenance-schedule') schedule(@Param('vehicleId') v: string) { return this.records.getMaintenanceSchedule(v); }
  @Post('maintenance-schedule') @UseGuards(AdminWriteGuard) createSchedule(@Param('vehicleId') v: string, @Body() b: MaintenanceScheduleInput) { return this.records.createMaintenanceSchedule(v, b); }
  @Patch('maintenance-schedule/:id') @UseGuards(AdminWriteGuard) updateSchedule(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: Partial<MaintenanceScheduleInput>) { return this.records.updateMaintenanceSchedule(v, id, b); }
  @Post('tires') @UseGuards(AdminWriteGuard) createTire(@Param('vehicleId') v: string, @Body() b: TireSetInput) { return this.records.createTire(v, b); }
  @Patch('tires/:id') @UseGuards(AdminWriteGuard) updateTire(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: Partial<TireSetInput>) { return this.records.updateTire(v, id, b); }
  @Post('tires/:id/status') @UseGuards(AdminWriteGuard) tireStatus(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: StatusChangeInput) { return this.records.changeStatus('tires', v, id, b); }
  @Post('tires/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousTire(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markErroneous('tires', v, id, b); }
  @Post('tires/:id/seasonal-change') @UseGuards(AdminWriteGuard) seasonalTireChange(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: SeasonalTireChangeInput) { return this.records.seasonalTireChange(v, id, b); }
  @Post('batteries') @UseGuards(AdminWriteGuard) createBattery(@Param('vehicleId') v: string, @Body() b: BatteryInput) { return this.records.createBattery(v, b); }
  @Patch('batteries/:id') @UseGuards(AdminWriteGuard) updateBattery(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: Partial<BatteryInput>) { return this.records.updateBattery(v, id, b); }
  @Post('batteries/:id/status') @UseGuards(AdminWriteGuard) batteryStatus(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: StatusChangeInput) { return this.records.changeStatus('batteries', v, id, b); }
  @Post('batteries/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousBattery(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markErroneous('batteries', v, id, b); }
  @Post('detailing') @UseGuards(AdminWriteGuard) createDetailing(@Param('vehicleId') v: string, @Body() b: DetailingInput) { return this.records.createDetailing(v, b); }
  @Patch('detailing/:id') @UseGuards(AdminWriteGuard) updateDetailing(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: Partial<DetailingInput>) { return this.records.updateDetailing(v, id, b); }
  @Post('detailing/:id/status') @UseGuards(AdminWriteGuard) detailingStatus(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: StatusChangeInput) { return this.records.changeStatus('detailing', v, id, b); }
  @Post('detailing/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousDetailing(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markErroneous('detailing', v, id, b); }
  @Post('parts') @UseGuards(AdminWriteGuard) createPart(@Param('vehicleId') v: string, @Body() b: PartInput) { return this.records.createPart(v, b); }
  @Patch('parts/:id') @UseGuards(AdminWriteGuard) updatePart(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: Partial<PartInput>) { return this.records.updatePart(v, id, b); }
  @Post('parts/:id/status') @UseGuards(AdminWriteGuard) partStatus(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: StatusChangeInput) { return this.records.changeStatus('parts', v, id, b); }
  @Post('parts/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousPart(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markErroneous('parts', v, id, b); }
  @Post('maintenance/:id/status') @UseGuards(AdminWriteGuard) maintenanceStatus(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: StatusChangeInput) { return this.records.changeExistingStatus('maintenance', v, id, b); }
  @Post('maintenance/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousMaintenance(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markExistingErroneous('maintenance', v, id, b); }
  @Post('maintenance-schedule/:id/status') @UseGuards(AdminWriteGuard) scheduleStatus(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: StatusChangeInput) { return this.records.changeExistingStatus('schedule', v, id, b); }
  @Post('maintenance-schedule/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousSchedule(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markExistingErroneous('schedule', v, id, b); }
  @Post('documents/:id/status') @UseGuards(AdminWriteGuard) documentStatus(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: StatusChangeInput) { return this.records.changeExistingStatus('documents', v, id, b); }
  @Post('documents/:id/mark-erroneous') @UseGuards(AdminWriteGuard) erroneousDocument(@Param('vehicleId') v: string, @Param('id') id: string, @Body() b: MarkErroneousInput) { return this.records.markExistingErroneous('documents', v, id, b); }
}
