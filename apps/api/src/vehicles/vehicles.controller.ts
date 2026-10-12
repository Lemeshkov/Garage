import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminWriteGuard } from '../auth/admin-session.guard';
import { ChangeVehicleStatusDto, CreateMileageEntryDto, CreateVehicleDto, MarkMileageErroneousDto, UpdateVehicleDto } from './vehicle.types';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}
  @Get() findAll(@Query('group') group?: string) { return this.vehicles.findAll(group); }
  @Get(':id') findOne(@Param('id') id: string) { return this.vehicles.findOne(id); }
  @Post() @UseGuards(AdminWriteGuard) create(@Body() body: CreateVehicleDto) { return this.vehicles.create(body); }
  @Patch(':id') @UseGuards(AdminWriteGuard) update(@Param('id') id: string, @Body() body: UpdateVehicleDto) { return this.vehicles.update(id, body); }
  @Post(':id/mileage') @UseGuards(AdminWriteGuard) addMileage(@Param('id') id: string, @Body() body: CreateMileageEntryDto) { return this.vehicles.addMileage(id, body); }
  @Post(':id/mileage/:entryId/mark-erroneous') @UseGuards(AdminWriteGuard) markMileageErroneous(@Param('id') id: string, @Param('entryId') entryId: string, @Body() body: MarkMileageErroneousDto) { return this.vehicles.markMileageErroneous(id, entryId, body); }
  @Post(':id/photo') @UseGuards(AdminWriteGuard) @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } })) uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) { return this.vehicles.replacePhoto(id, file); }
  @Post(':id/photo/archive') @UseGuards(AdminWriteGuard) archivePhoto(@Param('id') id: string) { return this.vehicles.archivePhoto(id); }
  @Post(':id/status') @UseGuards(AdminWriteGuard) changeStatus(@Param('id') id: string, @Body() body: ChangeVehicleStatusDto) { return this.vehicles.changeStatus(id, body); }
}
