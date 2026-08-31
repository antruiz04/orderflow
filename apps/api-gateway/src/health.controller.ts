import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

type SvcStatus = 'up' | 'down';

@Controller('health')
export class HealthController {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check() {
    const services = {
      auth: await this.probe(
        `${this.config.getOrThrow('AUTH_BASE_URL')}/health`,
      ),
      catalog: await this.probe(
        `${this.config.getOrThrow('CATALOG_BASE_URL')}/health/`,
      ),
      orders: await this.probe(
        `${this.config.getOrThrow('ORDERS_BASE_URL')}/health`,
      ),
      inventory: await this.probe(
        `${this.config.getOrThrow('INVENTORY_BASE_URL')}/health`,
      ),
    };

    const allUp = Object.values(services).every((s) => s === 'up');
    if (!allUp) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'api-gateway',
        services,
      });
    }

    return {
      status: 'ok',
      service: 'api-gateway',
      services,
    };
  }

  private async probe(url: string): Promise<SvcStatus> {
    try {
      const res = await firstValueFrom(this.http.get(url));
      return res.status >= 200 && res.status < 300 ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
