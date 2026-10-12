import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VehicleGroup, VehicleStatus, VehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { ChangeVehicleStatusDto, CreateMileageEntryDto, CreateVehicleDto, MarkMileageErroneousDto, UpdateVehicleDto } from './vehicle.types';
import { AdminActorContext } from '../auth/admin-actor.context';

const groups = new Set(Object.values(VehicleGroup));
const types = new Set(Object.values(VehicleType));
const vehicleTransitions: Record<VehicleStatus, readonly VehicleStatus[]> = { ACTIVE: ['STORED','SOLD','WRITTEN_OFF'], STORED: ['ACTIVE','SOLD','WRITTEN_OFF'], SOLD: [], WRITTEN_OFF: [] };

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService, private readonly uploads: UploadsService, private readonly actor: AdminActorContext = new AdminActorContext()) {}
  private json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  async findAll(group?: string) { if (group && !groups.has(group as VehicleGroup)) throw new BadRequestException('Неизвестная группа транспорта.'); return this.prisma.vehicle.findMany({ where: group ? { group: group as VehicleGroup } : undefined, orderBy: { createdAt: 'desc' } }); }
  async findOne(id: string) { const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, include: { mileageHistory: { orderBy: { recordedAt: 'desc' } } } }); if (!vehicle) throw new NotFoundException('Транспорт не найден.'); return vehicle; }

  async create(input: CreateVehicleDto) {
    this.validate(input);
    return this.prisma.$transaction(async tx => {
      const vehicle = await tx.vehicle.create({ data: { ...input, description: input.description?.trim() || null, mileageHistory: input.currentMileage === null ? undefined : { create: { value: input.currentMileage, comment: 'Начальное значение пробега' } } } });
      await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId: vehicle.id, entityType: 'Vehicle', entityId: vehicle.id, action: 'CREATE', newValues: this.json(vehicle) } });
      await tx.operationEvent.create({ data: { ...this.actor.eventFields(), vehicleId: vehicle.id, type: 'CREATED', sourceEntity: 'Vehicle', sourceId: vehicle.id, occurredAt: vehicle.createdAt, description: 'Транспортное средство создано', mileage: vehicle.currentMileage } });
      return vehicle;
    });
  }
  async update(id: string, input: UpdateVehicleDto) {
    const old = await this.findOne(id); const { correctionReason, ...changes } = input; this.validate(changes, true);
    if ((old.status === 'SOLD' || old.status === 'WRITTEN_OFF') && !correctionReason?.trim()) throw new BadRequestException('Для исправления архивного автомобиля обязательна причина.');
    return this.prisma.$transaction(async tx => {
      const vehicle = await tx.vehicle.update({ where: { id }, data: { ...changes, description: changes.description?.trim() || null } });
      await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId: id, entityType: 'Vehicle', entityId: id, action: 'UPDATE', oldValues: this.json(old), newValues: this.json(vehicle), correctionReason: correctionReason?.trim() || null } });
      return vehicle;
    });
  }
  async addMileage(id: string, input: CreateMileageEntryDto) {
    const vehicle = await this.findOne(id); if (vehicle.status === 'SOLD' || vehicle.status === 'WRITTEN_OFF') throw new BadRequestException('Для архивного автомобиля новый пробег запрещён.'); if (!Number.isInteger(input.value) || input.value < 0) throw new BadRequestException('Пробег должен быть целым неотрицательным числом.');
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date(); if (Number.isNaN(recordedAt.valueOf())) throw new BadRequestException('Некорректная дата пробега.');
    return this.prisma.$transaction(async tx => {
      const entry = await tx.mileageEntry.create({ data: { vehicleId: id, value: input.value, comment: input.comment?.trim() || null, recordedAt } });
      await tx.vehicle.update({ where: { id }, data: { currentMileage: input.value } });
      await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId: id, entityType: 'MileageEntry', entityId: entry.id, action: 'CREATE', newValues: this.json(entry) } });
      await tx.operationEvent.create({ data: { ...this.actor.eventFields(), vehicleId: id, type: 'MILEAGE_RECORDED', sourceEntity: 'MileageEntry', sourceId: entry.id, occurredAt: recordedAt, description: 'Зафиксирован пробег', mileage: input.value, comment: input.comment?.trim() || null } });
      return entry;
    });
  }
  async replacePhoto(id: string, file: Express.Multer.File) {
    const current = await this.findOne(id); const photoPath = await this.uploads.saveVehiclePhoto(file);
    if (current.status === 'SOLD' || current.status === 'WRITTEN_OFF') { await this.uploads.discardUncommitted(photoPath); throw new BadRequestException('Фотографию архивного автомобиля нельзя менять обычным API.'); }
    try { return await this.prisma.$transaction(async tx => { const updated = await tx.vehicle.update({ where: { id }, data: { photoPath } }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId: id, entityType: 'Vehicle', entityId: id, action: 'UPDATE', oldValues: this.json({ photoPath: current.photoPath }), newValues: this.json({ photoPath }) } }); return updated; }); }
    catch (error) { await this.uploads.discardUncommitted(photoPath); throw error; }
  }
  async archivePhoto(id: string) {
    const current = await this.findOne(id);
    if (current.status === 'SOLD' || current.status === 'WRITTEN_OFF') throw new BadRequestException('Фотографию архивного автомобиля нельзя менять обычным API.');
    return this.prisma.$transaction(async tx => { const updated = await tx.vehicle.update({ where: { id }, data: { photoPath: null } }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId: id, entityType: 'Vehicle', entityId: id, action: 'UPDATE', oldValues: this.json({ photoPath: current.photoPath }), newValues: this.json({ photoPath: null }) } }); return updated; });
  }
  async markMileageErroneous(vehicleId: string, entryId: string, input: MarkMileageErroneousDto) {
    const reason = input.reason?.trim(); if (!reason) throw new BadRequestException('Причина ошибочной записи обязательна.'); const old = await this.prisma.mileageEntry.findFirst({ where: { id: entryId, vehicleId } }); if (!old) throw new NotFoundException('Запись пробега не найдена.'); if (old.isErroneous) throw new BadRequestException('Запись уже помечена ошибочной.'); const now = new Date();
    return this.prisma.$transaction(async tx => { const vehicleBefore = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } }); const record = await tx.mileageEntry.update({ where: { id: entryId }, data: { isErroneous: true, erroneousAt: now, erroneousReason: reason } }); await tx.operationEvent.updateMany({ where: { vehicleId, sourceEntity: 'MileageEntry', sourceId: entryId }, data: { isErroneous: true, erroneousAt: now, erroneousReason: reason } }); const latest = await tx.mileageEntry.findFirst({ where: { vehicleId, isErroneous: false }, orderBy: { recordedAt: 'desc' } }); const vehicleAfter = await tx.vehicle.update({ where: { id: vehicleId }, data: { currentMileage: latest?.value ?? null } }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: 'MileageEntry', entityId: entryId, action: 'MARK_ERRONEOUS', oldValues: this.json(old), newValues: this.json(record), changedAt: now, correctionReason: reason } }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: 'Vehicle', entityId: vehicleId, action: 'UPDATE', oldValues: this.json(vehicleBefore), newValues: this.json(vehicleAfter), changedAt: now, correctionReason: `Пересчёт пробега: ${reason}` } }); return record; });
  }
  async changeStatus(id: string, input: ChangeVehicleStatusDto) {
    const old = await this.findOne(id); const next = input.status as VehicleStatus;
    if (!Object.values(VehicleStatus).includes(next)) throw new BadRequestException('Некорректный статус транспорта.');
    if (!vehicleTransitions[old.status].includes(next)) throw new BadRequestException(`Переход ${old.status} → ${next} запрещён.`);
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date(); if (Number.isNaN(occurredAt.valueOf())) throw new BadRequestException('Некорректная дата смены статуса.');
    return this.prisma.$transaction(async tx => { const vehicle = await tx.vehicle.update({ where: { id }, data: { status: next, statusChangedAt: occurredAt, statusReason: input.reason?.trim() || null, statusComment: input.comment?.trim() || null } }); const type = next === 'SOLD' ? 'SOLD' : next === 'WRITTEN_OFF' ? 'RETIRED' : next === 'STORED' ? 'STORED' : 'STATUS_CHANGED'; await tx.operationEvent.create({ data: { ...this.actor.eventFields(), vehicleId: id, type, sourceEntity: 'Vehicle', sourceId: id, occurredAt, description: `Статус транспорта изменён: ${old.status} → ${next}`, reason: input.reason?.trim() || null, comment: input.comment?.trim() || null } }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId: id, entityType: 'Vehicle', entityId: id, action: 'STATUS_CHANGE', oldValues: this.json(old), newValues: this.json(vehicle), changedAt: occurredAt, correctionReason: input.reason?.trim() || null } }); return vehicle; });
  }
  private validate(input: Partial<CreateVehicleDto>, partial = false): void {
    if (!partial || input.group !== undefined) if (!input.group || !groups.has(input.group)) throw new BadRequestException('Некорректная группа транспорта.');
    if (!partial || input.type !== undefined) if (!input.type || !types.has(input.type)) throw new BadRequestException('Некорректный тип транспорта.');
    for (const field of ['brand','model','licensePlate','vin'] as const) if ((!partial || input[field] !== undefined) && !input[field]?.trim()) throw new BadRequestException(`Поле ${field} обязательно.`);
    if ((!partial || input.year !== undefined) && input.year !== null && (!Number.isInteger(input.year) || input.year! < 1886 || input.year! > new Date().getFullYear() + 1)) throw new BadRequestException('Некорректный год выпуска.');
    if ((!partial || input.currentMileage !== undefined) && input.currentMileage !== null && (!Number.isInteger(input.currentMileage) || input.currentMileage! < 0)) throw new BadRequestException('Пробег должен быть целым неотрицательным числом.');
  }
}
