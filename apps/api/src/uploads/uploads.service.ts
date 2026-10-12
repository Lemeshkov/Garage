import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const maxSize = 5 * 1024 * 1024;
type DetectedImage = { extension: 'jpg' | 'png' | 'webp'; mimeType: string };

@Injectable()
export class UploadsService {
  readonly directory = resolve(process.env.UPLOADS_DIR ?? join(process.cwd(), 'data', 'uploads'));

  async saveVehiclePhoto(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer?.length) throw new BadRequestException('Файл фотографии не получен.');
    if (file.size > maxSize) throw new BadRequestException('Размер фотографии не должен превышать 5 МБ.');
    const image = this.detectImage(file.buffer);
    await mkdir(join(this.directory, 'vehicles'), { recursive: true });
    const fileName = `${randomUUID()}.${image.extension}`;
    try { await writeFile(join(this.directory, 'vehicles', fileName), file.buffer, { flag: 'wx' }); } catch { throw new InternalServerErrorException('Не удалось сохранить фотографию.'); }
    return `vehicles/${fileName}`;
  }

  /** Compensation only: use exclusively for a newly written file whose DB transaction failed. */
  async discardUncommitted(relativePath: string | null | undefined): Promise<void> {
    if (!relativePath || !relativePath.startsWith('vehicles/')) return;
    const target = resolve(this.directory, relativePath);
    if (!target.startsWith(this.directory)) return;
    await unlink(target).catch(() => undefined);
  }

  private detectImage(buffer: Buffer): DetectedImage {
    if (buffer.length < 12) throw new BadRequestException('Файл не является допустимым изображением.');
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: 'jpg', mimeType: 'image/jpeg' };
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: 'png', mimeType: 'image/png' };
    if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return { extension: 'webp', mimeType: 'image/webp' };
    throw new BadRequestException('Поддерживаются только фактические файлы JPEG, PNG и WebP.');
  }
}
