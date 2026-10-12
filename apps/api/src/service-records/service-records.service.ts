import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OperationEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BatteryInput, DetailingInput, MarkErroneousInput, PartInput, SeasonalTireChangeInput, StatusChangeInput, TireSetInput } from './service-record.types';
import { AdminActorContext } from '../auth/admin-actor.context';

type AnyInput = Record<string, unknown>;
type Kind = 'tires' | 'batteries' | 'detailing' | 'parts';
const entityName: Record<Kind, string> = { tires: 'TireSet', batteries: 'VehicleBattery', detailing: 'DetailingRecord', parts: 'VehiclePart' };
const transitions: Record<Kind, Record<string, readonly string[]>> = {
  tires: { INSTALLED: ['REMOVED','STORED','SOLD','RETIRED'], STORED: ['INSTALLED','SOLD','RETIRED'], REMOVED: ['STORED','INSTALLED','SOLD','RETIRED'], SOLD: [], RETIRED: [] },
  batteries: { IN_STOCK: ['INSTALLED','RETIRED'], INSTALLED: ['REMOVED','RETIRED'], REMOVED: ['INSTALLED','RETIRED'], RETIRED: [] },
  detailing: { PLANNED: ['COMPLETED','CANCELLED'], COMPLETED: ['INACTIVE'], CANCELLED: [], INACTIVE: [] },
  parts: { PURCHASED: ['IN_STOCK','INSTALLED','RETURNED','RETIRED'], IN_STOCK: ['INSTALLED','RETURNED','RETIRED'], INSTALLED: ['REMOVED','RETIRED'], REMOVED: ['IN_STOCK','INSTALLED','RETURNED','RETIRED'], RETURNED: [], RETIRED: [] },
};
const eventForStatus: Record<string, OperationEventType> = { INSTALLED: 'INSTALLED', REMOVED: 'REMOVED', STORED: 'STORED', SOLD: 'SOLD', RETIRED: 'RETIRED', RETURNED: 'RETURNED', COMPLETED: 'WORK_COMPLETED' };

@Injectable()
export class ServiceRecordsService {
  constructor(private readonly prisma: PrismaService, private readonly actor: AdminActorContext = new AdminActorContext()) {}
  private json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private async vehicleState(vehicleId: string) { const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true, status: true } }); if (!vehicle) throw new NotFoundException('Транспортное средство не найдено.'); return vehicle; }
  private async ensureOperational(vehicleId: string) { const vehicle = await this.vehicleState(vehicleId); if (vehicle.status === 'SOLD' || vehicle.status === 'WRITTEN_OFF') throw new BadRequestException('Для архивного автомобиля новые эксплуатационные операции запрещены.'); return vehicle; }
  private required(value: unknown, label: string) { if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`Поле «${label}» обязательно.`); return value.trim(); }
  private text(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : null; }
  private date(value: unknown, label: string, required = false) { if (value === null || value === undefined || value === '') { if (required) throw new BadRequestException(`Поле «${label}» обязательно.`); return null; } const result = new Date(String(value)); if (Number.isNaN(result.valueOf())) throw new BadRequestException(`Некорректная дата: ${label}.`); return result; }
  private integer(value: unknown, label: string, min = 0, required = false) { if (value === null || value === undefined || value === '') { if (required) throw new BadRequestException(`Поле «${label}» обязательно.`); return null; } if (!Number.isInteger(value) || Number(value) < min) throw new BadRequestException(`Некорректное значение: ${label}.`); return Number(value); }
  private money(value: unknown, label: string) { if (value === null || value === undefined || value === '') return null; try { const result = new Prisma.Decimal(String(value).replace(',', '.')); if (result.isNegative()) throw new Error(); return result; } catch { throw new BadRequestException(`Некорректная сумма: ${label}.`); } }
  private enumValue<T extends string>(value: unknown, values: readonly T[], label: string): T { if (!values.includes(value as T)) throw new BadRequestException(`Некорректное значение: ${label}.`); return value as T; }
  private async owned(kind: Kind, vehicleId: string, id: string) { const delegates = { tires: this.prisma.tireSet, batteries: this.prisma.vehicleBattery, detailing: this.prisma.detailingRecord, parts: this.prisma.vehiclePart }; const record = await (delegates[kind] as any).findFirst({ where: { id, vehicleId } }); if (!record) throw new NotFoundException('Запись не найдена у выбранного транспортного средства.'); return record as AnyInput & { id: string; status: string }; }
  private eventDescription(kind: Kind, status: string, record: AnyInput) { const name = kind === 'detailing' ? record.serviceType : kind === 'parts' ? record.name : `${record.brand ?? ''} ${record.model ?? ''}`.trim(); return `${name}: статус изменён на ${status}`; }

  listTires(vehicleId: string) { return this.prisma.tireSet.findMany({ where: { vehicleId }, include: { changes: { orderBy: { changedAt: 'desc' } } }, orderBy: { createdAt: 'desc' } }); }
  listBatteries(vehicleId: string) { return this.prisma.vehicleBattery.findMany({ where: { vehicleId }, orderBy: { createdAt: 'desc' } }); }
  listDetailing(vehicleId: string) { return this.prisma.detailingRecord.findMany({ where: { vehicleId }, orderBy: { performedAt: 'desc' } }); }
  listParts(vehicleId: string) { return this.prisma.vehiclePart.findMany({ where: { vehicleId }, orderBy: { createdAt: 'desc' } }); }

  async createTire(vehicleId: string, input: TireSetInput) { await this.ensureOperational(vehicleId); return this.create('tires', vehicleId, this.tireData(input as AnyInput)); }
  async createBattery(vehicleId: string, input: BatteryInput) { await this.ensureOperational(vehicleId); return this.create('batteries', vehicleId, this.batteryData(input as AnyInput)); }
  async createDetailing(vehicleId: string, input: DetailingInput) { await this.ensureOperational(vehicleId); return this.create('detailing', vehicleId, this.detailingData(input as AnyInput)); }
  async createPart(vehicleId: string, input: PartInput) { await this.ensureOperational(vehicleId); return this.create('parts', vehicleId, this.partData(input as AnyInput)); }
  private async create(kind: Kind, vehicleId: string, data: AnyInput) { return this.prisma.$transaction(async tx => { const record = await ({ tires: tx.tireSet, batteries: tx.vehicleBattery, detailing: tx.detailingRecord, parts: tx.vehiclePart }[kind] as any).create({ data: { vehicleId, ...data } }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: entityName[kind], entityId: record.id, action: 'CREATE', newValues: this.json(record) } }); await tx.operationEvent.create({ data: { ...this.actor.eventFields(), vehicleId, type: 'CREATED', sourceEntity: entityName[kind], sourceId: record.id, occurredAt: record.createdAt, description: `${entityName[kind]} создана` } }); return record; }); }

  async updateTire(vehicleId: string, id: string, input: Partial<TireSetInput>) { const old = await this.owned('tires', vehicleId, id); return this.update('tires', vehicleId, old, this.tireData({ ...old, ...input }, old.status), input.correctionReason); }
  async updateBattery(vehicleId: string, id: string, input: Partial<BatteryInput>) { const old = await this.owned('batteries', vehicleId, id); return this.update('batteries', vehicleId, old, this.batteryData({ ...old, ...input }, old.status), input.correctionReason); }
  async updateDetailing(vehicleId: string, id: string, input: Partial<DetailingInput>) { const old = await this.owned('detailing', vehicleId, id); return this.update('detailing', vehicleId, old, this.detailingData({ ...old, ...input }, old.status), input.correctionReason); }
  async updatePart(vehicleId: string, id: string, input: Partial<PartInput>) { const old = await this.owned('parts', vehicleId, id); return this.update('parts', vehicleId, old, this.partData({ ...old, ...input }, old.status), input.correctionReason); }
  private async update(kind: Kind, vehicleId: string, old: AnyInput & { id: string }, data: AnyInput, correctionReason?: string | null) { const vehicle = await this.vehicleState(vehicleId); if ((vehicle.status === 'SOLD' || vehicle.status === 'WRITTEN_OFF') && !this.text(correctionReason)) throw new BadRequestException('Для исправления архивных данных обязательна причина.'); return this.prisma.$transaction(async tx => { const record = await ({ tires: tx.tireSet, batteries: tx.vehicleBattery, detailing: tx.detailingRecord, parts: tx.vehiclePart }[kind] as any).update({ where: { id: old.id }, data }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: entityName[kind], entityId: old.id, action: 'UPDATE', oldValues: this.json(old), newValues: this.json(record), correctionReason: this.text(correctionReason) } }); return record; }); }

  async changeStatus(kind: Kind, vehicleId: string, id: string, input: StatusChangeInput) {
    await this.ensureOperational(vehicleId); const old = await this.owned(kind, vehicleId, id); if (old.isErroneous) throw new BadRequestException('Ошибочную запись нельзя использовать в эксплуатации.'); const next = String(input.status); const allowed = transitions[kind][old.status] ?? [];
    if (!allowed.includes(next)) throw new BadRequestException(`Переход ${old.status} → ${next} запрещён.`);
    const occurredAt = input.occurredAt ? this.date(input.occurredAt, 'дата операции', true)! : new Date(); const mileage = this.integer(input.mileage, 'пробег');
    return this.prisma.$transaction(async tx => {
      const data: AnyInput = { status: next, statusChangedAt: occurredAt, statusReason: this.text(input.reason), statusComment: this.text(input.comment) };
      if (kind === 'tires' && next === 'INSTALLED') Object.assign(data, { installedAt: occurredAt, installedMileage: mileage });
      if (kind === 'batteries' && next === 'INSTALLED') Object.assign(data, { installedAt: occurredAt, installedMileage: mileage, removedAt: null });
      if (kind === 'batteries' && next === 'REMOVED') Object.assign(data, { removedAt: occurredAt });
      if (kind === 'parts' && next === 'INSTALLED') Object.assign(data, { installedAt: occurredAt, installedMileage: mileage });
      const record = await ({ tires: tx.tireSet, batteries: tx.vehicleBattery, detailing: tx.detailingRecord, parts: tx.vehiclePart }[kind] as any).update({ where: { id }, data });
      if (kind === 'tires' && (next === 'INSTALLED' || next === 'REMOVED')) await tx.tireChangeHistory.create({ data: { vehicleId, tireSetId: id, action: next, changedAt: occurredAt, mileage, notes: this.text(input.comment) } });
      await tx.operationEvent.create({ data: { ...this.actor.eventFields(), vehicleId, type: eventForStatus[next] ?? 'STATUS_CHANGED', sourceEntity: entityName[kind], sourceId: id, occurredAt, description: this.eventDescription(kind, next, old), mileage, reason: this.text(input.reason), comment: this.text(input.comment) } });
      await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: entityName[kind], entityId: id, action: 'STATUS_CHANGE', oldValues: this.json(old), newValues: this.json(record), changedAt: occurredAt, correctionReason: this.text(input.reason) } });
      return record;
    });
  }

  async seasonalTireChange(vehicleId: string, incomingId: string, input: SeasonalTireChangeInput) {
    await this.ensureOperational(vehicleId);
    if (!input.outgoingTireSetId || input.outgoingTireSetId === incomingId) throw new BadRequestException('Укажите другой снимаемый комплект шин.');
    const incoming = await this.owned('tires', vehicleId, incomingId); const outgoing = await this.owned('tires', vehicleId, input.outgoingTireSetId);
    if (incoming.isErroneous || outgoing.isErroneous) throw new BadRequestException('Ошибочную запись нельзя использовать в сезонной замене.');
    if (!['STORED','REMOVED'].includes(incoming.status) || outgoing.status !== 'INSTALLED') throw new BadRequestException('Сезонная замена возможна для установленного и хранящегося комплектов.');
    const occurredAt = input.occurredAt ? this.date(input.occurredAt, 'дата замены', true)! : new Date(); const mileage = this.integer(input.mileage, 'пробег');
    return this.prisma.$transaction(async tx => {
      const removed = await tx.tireSet.update({ where: { id: outgoing.id }, data: { status: 'REMOVED', statusChangedAt: occurredAt, statusReason: this.text(input.reason), statusComment: this.text(input.comment) } });
      const installed = await tx.tireSet.update({ where: { id: incoming.id }, data: { status: 'INSTALLED', statusChangedAt: occurredAt, statusReason: this.text(input.reason), statusComment: this.text(input.comment), installedAt: occurredAt, installedMileage: mileage } });
      await tx.tireChangeHistory.createMany({ data: [{ vehicleId, tireSetId: outgoing.id, action: 'REMOVED', changedAt: occurredAt, mileage, notes: this.text(input.comment) }, { vehicleId, tireSetId: incoming.id, action: 'INSTALLED', changedAt: occurredAt, mileage, notes: this.text(input.comment) }] });
      await tx.operationEvent.create({ data: { ...this.actor.eventFields(), vehicleId, type: 'SEASONAL_CHANGE', sourceEntity: 'TireSet', sourceId: incoming.id, occurredAt, description: `Сезонная замена: ${outgoing.brand} ${outgoing.model} → ${incoming.brand} ${incoming.model}`, mileage, reason: this.text(input.reason), comment: this.text(input.comment) } });
      await tx.auditLog.createMany({ data: [{ ...this.actor.auditFields(), vehicleId, entityType: 'TireSet', entityId: outgoing.id, action: 'STATUS_CHANGE', oldValues: this.json(outgoing), newValues: this.json(removed), changedAt: occurredAt, correctionReason: this.text(input.reason) }, { ...this.actor.auditFields(), vehicleId, entityType: 'TireSet', entityId: incoming.id, action: 'STATUS_CHANGE', oldValues: this.json(incoming), newValues: this.json(installed), changedAt: occurredAt, correctionReason: this.text(input.reason) }] });
      return { removed, installed };
    });
  }

  async timeline(vehicleId: string, type?: string) { await this.vehicleState(vehicleId); return this.prisma.operationEvent.findMany({ where: { vehicleId, isErroneous: false, type: type ? this.enumValue(type, Object.values(OperationEventType), 'тип события') : undefined }, orderBy: { occurredAt: 'desc' } }); }
  async audit(vehicleId: string) { await this.vehicleState(vehicleId); return this.prisma.auditLog.findMany({ where: { vehicleId }, orderBy: { changedAt: 'desc' } }); }
  async markErroneous(kind: Kind, vehicleId: string, id: string, input: MarkErroneousInput) {
    const reason = this.required(input.reason, 'причина ошибочной записи'); const old = await this.owned(kind, vehicleId, id);
    if (old.isErroneous) throw new BadRequestException('Запись уже помечена ошибочной.');
    const now = new Date();
    return this.prisma.$transaction(async tx => {
      const delegates = { tires: tx.tireSet, batteries: tx.vehicleBattery, detailing: tx.detailingRecord, parts: tx.vehiclePart };
      const record = await (delegates[kind] as any).update({ where: { id }, data: { isErroneous: true, erroneousAt: now, erroneousReason: reason } });
      await tx.operationEvent.updateMany({ where: { vehicleId, sourceEntity: entityName[kind], sourceId: id }, data: { isErroneous: true, erroneousAt: now, erroneousReason: reason } });
      if (kind === 'tires') await tx.tireChangeHistory.updateMany({ where: { vehicleId, tireSetId: id }, data: { isErroneous: true, erroneousAt: now, erroneousReason: reason } });
      await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: entityName[kind], entityId: id, action: 'MARK_ERRONEOUS', oldValues: this.json(old), newValues: this.json(record), changedAt: now, correctionReason: reason } });
      return record;
    });
  }
  async changeExistingStatus(kind: 'maintenance' | 'schedule' | 'documents', vehicleId: string, id: string, input: StatusChangeInput) {
    await this.ensureOperational(vehicleId);
    const rules = { maintenance: { PLANNED: ['COMPLETED','CANCELLED'], COMPLETED: [], CANCELLED: [] }, schedule: { ACTIVE: ['COMPLETED','CANCELLED','INACTIVE'], INACTIVE: ['ACTIVE','CANCELLED'], COMPLETED: [], CANCELLED: [] }, documents: { ACTIVE: ['EXPIRED','REVOKED','CANCELLED'], EXPIRED: ['ACTIVE','REVOKED','CANCELLED'], REVOKED: [], CANCELLED: [] } } as const;
    const delegates = { maintenance: this.prisma.maintenanceRecord, schedule: this.prisma.maintenanceSchedule, documents: this.prisma.vehicleDocument };
    const entities = { maintenance: 'MaintenanceRecord', schedule: 'MaintenanceSchedule', documents: 'VehicleDocument' };
    const old = await (delegates[kind] as any).findFirst({ where: { id, vehicleId } }) as AnyInput & { status: string } | null;
    if (!old) throw new NotFoundException('Запись не найдена у выбранного транспортного средства.');
    if (old.isErroneous) throw new BadRequestException('Ошибочную запись нельзя использовать в эксплуатации.');
    const next = String(input.status); const allowed = (rules[kind] as Record<string, readonly string[]>)[old.status] ?? [];
    if (!allowed.includes(next)) throw new BadRequestException(`Переход ${old.status} → ${next} запрещён.`);
    const occurredAt = input.occurredAt ? this.date(input.occurredAt, 'дата операции', true)! : new Date();
    return this.prisma.$transaction(async tx => {
      const txDelegates = { maintenance: tx.maintenanceRecord, schedule: tx.maintenanceSchedule, documents: tx.vehicleDocument };
      const record = await (txDelegates[kind] as any).update({ where: { id }, data: { status: next, statusChangedAt: occurredAt, statusReason: this.text(input.reason), statusComment: this.text(input.comment) } });
      await tx.operationEvent.create({ data: { ...this.actor.eventFields(), vehicleId, type: next === 'COMPLETED' ? 'WORK_COMPLETED' : 'STATUS_CHANGED', sourceEntity: entities[kind], sourceId: id, occurredAt, description: `${entities[kind]}: ${old.status} → ${next}`, reason: this.text(input.reason), comment: this.text(input.comment) } });
      await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: entities[kind], entityId: id, action: 'STATUS_CHANGE', oldValues: this.json(old), newValues: this.json(record), changedAt: occurredAt, correctionReason: this.text(input.reason) } });
      return record;
    });
  }
  async markExistingErroneous(kind: 'maintenance' | 'schedule' | 'documents', vehicleId: string, id: string, input: MarkErroneousInput) {
    const reason = this.required(input.reason, 'причина ошибочной записи'); const delegates = { maintenance: this.prisma.maintenanceRecord, schedule: this.prisma.maintenanceSchedule, documents: this.prisma.vehicleDocument }; const entities = { maintenance: 'MaintenanceRecord', schedule: 'MaintenanceSchedule', documents: 'VehicleDocument' };
    const old = await (delegates[kind] as any).findFirst({ where: { id, vehicleId } }) as AnyInput | null; if (!old) throw new NotFoundException('Запись не найдена у выбранного транспортного средства.'); if (old.isErroneous) throw new BadRequestException('Запись уже помечена ошибочной.'); const now = new Date();
    return this.prisma.$transaction(async tx => { const txDelegates = { maintenance: tx.maintenanceRecord, schedule: tx.maintenanceSchedule, documents: tx.vehicleDocument }; const record = await (txDelegates[kind] as any).update({ where: { id }, data: { isErroneous: true, erroneousAt: now, erroneousReason: reason } }); await tx.operationEvent.updateMany({ where: { vehicleId, sourceEntity: entities[kind], sourceId: id }, data: { isErroneous: true, erroneousAt: now, erroneousReason: reason } }); await tx.auditLog.create({ data: { ...this.actor.auditFields(), vehicleId, entityType: entities[kind], entityId: id, action: 'MARK_ERRONEOUS', oldValues: this.json(old), newValues: this.json(record), changedAt: now, correctionReason: reason } }); return record; });
  }
  private tireData(input: AnyInput, forcedStatus?: string) { return { season: this.enumValue(input.season, ['SUMMER','WINTER','ALL_SEASON'] as const, 'сезон'), brand: this.required(input.brand, 'марка'), model: this.required(input.model, 'модель'), tireSize: this.required(input.tireSize, 'размер'), quantity: this.integer(input.quantity, 'количество', 1, true)!, purchaseDate: this.date(input.purchaseDate, 'дата покупки'), purchasePrice: this.money(input.purchasePrice, 'стоимость покупки'), installedAt: this.date(input.installedAt, 'дата установки'), installedMileage: this.integer(input.installedMileage, 'пробег установки'), storageLocation: this.text(input.storageLocation), status: this.enumValue(forcedStatus ?? input.status, ['INSTALLED','STORED','REMOVED','SOLD','RETIRED'] as const, 'статус'), notes: this.text(input.notes) }; }
  private batteryData(input: AnyInput, forcedStatus?: string) { const installedAt = this.date(input.installedAt, 'дата установки'); const removedAt = this.date(input.removedAt, 'дата снятия'); if (installedAt && removedAt && removedAt < installedAt) throw new BadRequestException('Дата снятия не может быть раньше даты установки.'); return { brand: this.required(input.brand, 'марка'), model: this.required(input.model, 'модель'), capacityAh: this.integer(input.capacityAh, 'ёмкость', 1), purchaseDate: this.date(input.purchaseDate, 'дата покупки'), installedAt, installedMileage: this.integer(input.installedMileage, 'пробег установки'), price: this.money(input.price, 'стоимость'), warrantyUntil: this.date(input.warrantyUntil, 'гарантия до'), removedAt, replacementReason: this.text(input.replacementReason), notes: this.text(input.notes), status: this.enumValue(forcedStatus ?? input.status ?? 'IN_STOCK', ['IN_STOCK','INSTALLED','REMOVED','RETIRED'] as const, 'статус') }; }
  private detailingData(input: AnyInput, forcedStatus?: string) { return { serviceType: this.required(input.serviceType, 'вид услуги'), performedAt: this.date(input.performedAt, 'дата выполнения', true)!, provider: this.text(input.provider), cost: this.money(input.cost, 'стоимость'), description: this.text(input.description), protectionValidUntil: this.date(input.protectionValidUntil, 'защита действует до'), status: this.enumValue(forcedStatus ?? input.status ?? 'COMPLETED', ['PLANNED','COMPLETED','CANCELLED','INACTIVE'] as const, 'статус') }; }
  private partData(input: AnyInput, forcedStatus?: string) { return { name: this.required(input.name, 'название'), partNumber: this.text(input.partNumber), manufacturer: this.text(input.manufacturer), quantity: this.integer(input.quantity, 'количество', 1, true)!, unitPrice: this.money(input.unitPrice, 'цена за единицу'), purchasedAt: this.date(input.purchasedAt, 'дата покупки'), supplier: this.text(input.supplier), installedAt: this.date(input.installedAt, 'дата установки'), installedMileage: this.integer(input.installedMileage, 'пробег установки'), status: this.enumValue(forcedStatus ?? input.status, ['PURCHASED','IN_STOCK','INSTALLED','REMOVED','RETURNED','RETIRED'] as const, 'статус'), notes: this.text(input.notes) }; }
}
