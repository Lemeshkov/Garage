import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { VehicleGroup, VehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateMileageEntryDto, CreateVehicleDto, UpdateVehicleDto } from './vehicle.types';

const groups = new Set(Object.values(VehicleGroup));
const types = new Set(Object.values(VehicleType));

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService, private readonly uploads: UploadsService) {}

  async findAll(group?: string) {
    if (group && !groups.has(group as VehicleGroup)) throw new BadRequestException('Неизвестная группа транспорта.');
    return this.prisma.vehicle.findMany({ where: group ? { group: group as VehicleGroup } : undefined, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, include: { mileageHistory: { orderBy: { recordedAt: 'desc' } } } });
    if (!vehicle) throw new NotFoundException('Транспорт не найден.');
    return vehicle;
  }

  async create(input: CreateVehicleDto) {
    this.validate(input);
    return this.prisma.vehicle.create({ data: { ...input, description: input.description?.trim() || null, mileageHistory: input.currentMileage === null ? undefined : { create: { value: input.currentMileage, comment: 'Начальное значение пробега' } } } });
  }

  async update(id: string, input: UpdateVehicleDto) {
    await this.findOne(id);
    this.validate(input, true);
    return this.prisma.vehicle.update({ where: { id }, data: { ...input, description: input.description?.trim() || null } });
  }

  async addMileage(id: string, input: CreateMileageEntryDto) {
    await this.findOne(id);
    if (!Number.isInteger(input.value) || input.value < 0) throw new BadRequestException('Пробег должен быть целым неотрицательным числом.');
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
    if (Number.isNaN(recordedAt.valueOf())) throw new BadRequestException('Некорректная дата пробега.');
    return this.prisma.$transaction(async tx => {
      const entry = await tx.mileageEntry.create({ data: { vehicleId: id, value: input.value, comment: input.comment?.trim() || null, recordedAt } });
      await tx.vehicle.update({ where: { id }, data: { currentMileage: input.value } });
      return entry;
    });
  }

  async replacePhoto(id: string, file: Express.Multer.File) {
    const current = await this.findOne(id);
    const photoPath = await this.uploads.saveVehiclePhoto(file);
    try {
      const updated = await this.prisma.vehicle.update({ where: { id }, data: { photoPath } });
      await this.uploads.remove(current.photoPath);
      return updated;
    } catch (error) {
      await this.uploads.remove(photoPath);
      throw error;
    }
  }

  async removePhoto(id: string) {
    const current = await this.findOne(id);
    const updated = await this.prisma.vehicle.update({ where: { id }, data: { photoPath: null } });
    await this.uploads.remove(current.photoPath);
    return updated;
  }

  private validate(input: Partial<CreateVehicleDto>, partial = false): void {
    if (!partial || input.group !== undefined) if (!input.group || !groups.has(input.group)) throw new BadRequestException('Некорректная группа транспорта.');
    if (!partial || input.type !== undefined) if (!input.type || !types.has(input.type)) throw new BadRequestException('Некорректный тип транспорта.');
    for (const field of ['brand', 'model', 'licensePlate', 'vin'] as const) if ((!partial || input[field] !== undefined) && !input[field]?.trim()) throw new BadRequestException(`Поле ${field} обязательно.`);
    if ((!partial || input.year !== undefined) && input.year !== null && (!Number.isInteger(input.year) || input.year! < 1886 || input.year! > new Date().getFullYear() + 1)) throw new BadRequestException('Некорректный год выпуска.');
    if ((!partial || input.currentMileage !== undefined) && input.currentMileage !== null && (!Number.isInteger(input.currentMileage) || input.currentMileage! < 0)) throw new BadRequestException('Пробег должен быть целым неотрицательным числом.');
  }
}
