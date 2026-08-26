import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { KafkaService } from './kafka.service';

@Module({
  imports: [StockModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
