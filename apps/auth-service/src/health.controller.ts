import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    // ping a Postgres; si falla devolvemos 503
    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'ok',
        service: 'auth-service',
        database: 'up',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'auth-service',
        database: 'down',
      });
    }
  }
}
