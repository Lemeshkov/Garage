import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { createRequire } from 'module';
import { basename, extname, join, resolve } from 'path';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);
const { UploadsService } = require('../dist/uploads/uploads.service.js');
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');
const replaceExisting = process.argv.includes('--replace-existing');
if (dryRun === apply) throw new Error('Укажите ровно один режим: --dry-run или --apply.');
if (apply && !process.env.LOCAL_DEV_WRITE?.match(/^true$/i)) throw new Error('Для --apply необходим LOCAL_DEV_WRITE=true.');
const database = new URL(process.env.DATABASE_URL).pathname.slice(1);
if (database !== 'garage_db') throw new Error(`Скрипт разрешён только для garage_db; получено: ${database || '(пусто)'}`);

const imagesDir = resolve(import.meta.dirname, '..', '..', '..', 'img');
const tokens = value => basename(value, extname(value)).toLowerCase().replace(/[^a-z0-9а-яё]+/gi, ' ').trim().split(/\s+/);
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
const isImage = buffer => buffer.length >= 12 && ((buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) || buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'));
function matchFile(name, vehicle) {
  const t = tokens(name); const has = (...need) => need.every(part => t.some(token => token === part || token.includes(part)));
  const brand = vehicle.brand.trim().toLowerCase(); const model = vehicle.model.toLowerCase();
  if (brand === 'bentley') return has('bentley', 'continental');
  if (brand === 'toyota') return has('toyota', 'land', 'cruiser');
  if (brand === 'zeekr') return has('zeekr', '9x');
  if (brand === 'triumph') return has('triumph', 'speedmaster');
  if (brand === 'bmw' && model.includes('1300')) return has('bmw', 'r', '1300');
  if (brand === 'bmw') return has('bmw', 'x7');
  if (model === 'panamera gts') return has('porsche', 'panamera');
  if (model === 'cayenne gts') return has('porsche', 'cayenne', 'gts');
  if (model === 'cayenne s') return has('porsche', 'cayenne') && t.includes('s');
  return false;
}

if (!existsSync(imagesDir)) throw new Error(`Не найдена папка img: ${imagesDir}`);
const files = (await readdir(imagesDir)).filter(name => /\.(jpe?g|png|webp)$/i.test(name));
const prisma = new PrismaClient();
const uploads = new UploadsService();
try {
  const vehicles = await prisma.vehicle.findMany({ where: { group: 'VE' }, select: { id: true, brand: true, model: true, vin: true, photoPath: true } });
  const plan = vehicles.map(vehicle => {
    const matches = files.filter(file => matchFile(file, vehicle));
    return { vehicle, matches };
  });
  for (const item of plan) {
    const label = `${item.vehicle.brand.trim()} ${item.vehicle.model}`;
    if (item.matches.length !== 1) { console.log(`${label}: ${item.matches.length ? `неоднозначно (${item.matches.join(', ')})` : 'файл не найден'}`); continue; }
    const source = join(imagesDir, item.matches[0]); const content = await readFile(source);
    if (!isImage(content)) { console.log(`${label}: пропуск — некорректная сигнатура файла ${item.matches[0]}`); continue; }
    let action = item.vehicle.photoPath ? 'пропуск: уже есть фото' : 'загрузить';
    if (item.vehicle.photoPath) {
      const existing = join(uploads.directory, item.vehicle.photoPath);
      if (existsSync(existing) && sha(readFileSync(existing)) === sha(content)) action = 'пропуск: совпадает с текущим';
      else if (replaceExisting) action = 'заменить существующее';
      else action = 'требует --replace-existing';
    }
    console.log(`${label} | ${item.matches[0]} | ${item.vehicle.vin} | ${item.vehicle.photoPath ?? 'нет'} | ${action}`);
    if (!apply || !['загрузить', 'заменить существующее'].includes(action)) continue;
    const newPath = await uploads.saveVehiclePhoto({ buffer: content, size: content.length });
    try { await prisma.vehicle.update({ where: { id: item.vehicle.id }, data: { photoPath: newPath } }); await uploads.remove(item.vehicle.photoPath); } catch (error) { await uploads.remove(newPath); throw error; }
  }
  const candidates = new Set(plan.flatMap(item => item.matches));
  for (const file of files.filter(file => !candidates.has(file))) console.log(`Без сопоставления: ${file}`);
} finally { await prisma.$disconnect(); }
