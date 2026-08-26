import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, logLevel } from 'kafkajs';
import { OrderStatus } from './order.entity';
import { OrdersService } from './orders.service';

type InventoryReservedEvent = {
  event: 'inventory.reserved';
  orderId: string;
};

type InventoryFailedEvent = {
  event: 'inventory.failed';
  orderId: string;
  reason?: string;
};

/** Escucha inventory.* y actualiza status del pedido */
@Injectable()
export class InventoryEventsConsumer
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(InventoryEventsConsumer.name);
  private consumer: Consumer;
  private readonly topicReserved: string;
  private readonly topicFailed: string;

  constructor(
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    const broker = this.config.getOrThrow<string>('KAFKA_BROKER');
    this.topicReserved = this.config.getOrThrow<string>(
      'KAFKA_TOPIC_INVENTORY_RESERVED',
    );
    this.topicFailed = this.config.getOrThrow<string>(
      'KAFKA_TOPIC_INVENTORY_FAILED',
    );

    const kafka = new Kafka({
      clientId: `${this.config.get('KAFKA_CLIENT_ID') ?? 'orders-service'}-consumer`,
      brokers: [broker],
      logLevel: logLevel.ERROR,
    });

    this.consumer = kafka.consumer({
      groupId: this.config.get('KAFKA_GROUP_ID') ?? 'orders-service',
    });
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.topicReserved,
      fromBeginning: true,
    });
    await this.consumer.subscribe({
      topic: this.topicFailed,
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;
        try {
          const raw = JSON.parse(message.value.toString()) as
            | InventoryReservedEvent
            | InventoryFailedEvent;

          if (
            topic === this.topicReserved &&
            raw.event === 'inventory.reserved'
          ) {
            await this.ordersService.applyInventoryResult(
              raw.orderId,
              OrderStatus.CONFIRMED,
            );
            this.logger.log(`order confirmed id=${raw.orderId}`);
            return;
          }

          if (topic === this.topicFailed && raw.event === 'inventory.failed') {
            await this.ordersService.applyInventoryResult(
              raw.orderId,
              OrderStatus.CANCELLED,
            );
            this.logger.warn(
              `order cancelled id=${raw.orderId} reason=${(raw as InventoryFailedEvent).reason ?? ''}`,
            );
          }
        } catch (err) {
          this.logger.error(`Error en inventory.*: ${err}`);
        }
      },
    });

    this.logger.log(
      `Escuchando ${this.topicReserved} + ${this.topicFailed}`,
    );
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
