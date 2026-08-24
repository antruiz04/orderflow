import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export type CatalogProduct = {
  id: number;
  name: string;
  price: string;
  stock: number;
  is_active: boolean;
};

@Injectable()
export class CatalogClient {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config
      .getOrThrow<string>('CATALOG_BASE_URL')
      .replace(/\/$/, '');
  }

  // GET producto activo; el precio oficial sale de acá
  async getActiveProduct(productId: number): Promise<CatalogProduct> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<CatalogProduct>(
          `${this.baseUrl}/api/products/${productId}/`,
          { timeout: 5000 },
        ),
      );

      if (!data.is_active) {
        throw new NotFoundException(
          `Product ${productId} is not available`,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new NotFoundException(`Product ${productId} not found`);
      }

      throw new BadGatewayException(
        'Catalog service is unavailable; cannot verify product prices',
      );
    }
  }
}
