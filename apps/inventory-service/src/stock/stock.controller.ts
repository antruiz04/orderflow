import { Body, Controller, Get, Post } from '@nestjs/common';
import { UpsertStockDto } from './dto/upsert-stock.dto';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  list() {
    return this.stockService.list();
  }

  /** carga/ajusta stock local (demo). productId = id de Catalog */
  @Post()
  upsert(@Body() dto: UpsertStockDto) {
    return this.stockService.upsert(dto.productId, dto.quantity);
  }
}
