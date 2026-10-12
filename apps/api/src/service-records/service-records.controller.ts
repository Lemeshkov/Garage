import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminWriteGuard } from '../auth/admin-session.guard';
import { ServiceRecordsService } from './service-records.service';
import { BatteryInput, DetailingInput, MarkErroneousInput, PartInput, SeasonalTireChangeInput, StatusChangeInput, TireSetInput } from './service-record.types';

@Controller('vehicles/:vehicleId')
export class ServiceRecordsController {
  constructor(private readonly records: ServiceRecordsService) {}
  @Get('tires') listTires(@Param('vehicleId') v: string) { return this.records.listTires(v); }
  @Get('batteries') listBatteries(@Param('vehicleId') v: string) { return this.records.listBatteries(v); }
  @Get('detailing') listDetailing(@Param('vehicleId') v: string) { return this.records.listDetailing(v); }
  @Get('parts') listParts(@Param('vehicleId') v: string) { return this.records.listParts(v); }
  @Get('timeline') timeline(@Param('vehicleId') v: string, @Query('type') type?: string) { return this.records.timeline(v, type); }
  @Get('audit') @UseGuards(AdminWriteGuard) audit(@Param('vehicleId') v: string) { return this.records.audit(v); }
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
