import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * No solo comprueba que Node esté vivo:
   * también hace un SELECT 1 a Postgres.
   * Si la DB está caída → 503 (no fingimos que todo está bien).
   */
  @Get()
  async check() {
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
