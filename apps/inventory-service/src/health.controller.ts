import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { KafkaService } from './kafka/kafka.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly kafkaService: KafkaService,
  ) {}

  @Get()
  async check() {
    let database: 'up' | 'down' = 'down';
    let kafka: 'up' | 'down' = 'down';

    try {
      await this.dataSource.query('SELECT 1');
      database = 'up';
    } catch {
      /* ignore */
    }

    try {
      kafka = this.kafkaService.isConnected() ? 'up' : 'down';
    } catch {
      /* ignore */
    }

    if (database === 'down' || kafka === 'down') {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'inventory-service',
        database,
        kafka,
      });
    }

    return {
      status: 'ok',
      service: 'inventory-service',
      database,
      kafka,
    };
  }
}
