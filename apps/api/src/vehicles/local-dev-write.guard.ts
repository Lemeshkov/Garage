import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class LocalDevWriteGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (process.env.LOCAL_DEV_WRITE === 'true') return true;
    throw new ForbiddenException('Запись отключена. Для локальной разработки установите LOCAL_DEV_WRITE=true.');
  }
}
