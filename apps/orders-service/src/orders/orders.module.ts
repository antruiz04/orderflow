import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogClient } from '../catalog/catalog.client';
import { InventoryEventsConsumer } from './inventory-events.consumer';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 0,
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, CatalogClient, InventoryEventsConsumer],
  exports: [OrdersService],
})
export class OrdersModule {}
