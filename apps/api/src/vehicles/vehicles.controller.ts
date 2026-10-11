import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LocalDevWriteGuard } from './local-dev-write.guard';
import { CreateMileageEntryDto, CreateVehicleDto, UpdateVehicleDto } from './vehicle.types';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}
  @Get() findAll(@Query('group') group?: string) { return this.vehicles.findAll(group); }
  @Get(':id') findOne(@Param('id') id: string) { return this.vehicles.findOne(id); }
  @Post() @UseGuards(LocalDevWriteGuard) create(@Body() body: CreateVehicleDto) { return this.vehicles.create(body); }
  @Patch(':id') @UseGuards(LocalDevWriteGuard) update(@Param('id') id: string, @Body() body: UpdateVehicleDto) { return this.vehicles.update(id, body); }
  @Post(':id/mileage') @UseGuards(LocalDevWriteGuard) addMileage(@Param('id') id: string, @Body() body: CreateMileageEntryDto) { return this.vehicles.addMileage(id, body); }
  @Post(':id/photo') @UseGuards(LocalDevWriteGuard) @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } })) uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) { return this.vehicles.replacePhoto(id, file); }
  @Delete(':id/photo') @UseGuards(LocalDevWriteGuard) removePhoto(@Param('id') id: string) { return this.vehicles.removePhoto(id); }
}
