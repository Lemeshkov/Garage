import { Controller, Get } from '@nestjs/common';
import { ServiceRecordsService } from './service-records.service';

@Controller('events')
export class EventsController {
  constructor(private readonly records: ServiceRecordsService) {}
  @Get() list() { return this.records.warnings(); }
}
