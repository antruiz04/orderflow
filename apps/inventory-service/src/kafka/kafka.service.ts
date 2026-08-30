import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, Producer, logLevel } from 'kafkajs';
import { StockService } from '../stock/stock.service';

export type OrderCreatedEvent = {
  event: 'order.created';
  orderId: string;
  userId: string;
  userEmail?: string;
  total: string;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: string;
  }>;
  createdAt: string;
};

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private connected = false;

  private readonly topicOrderCreated: string;
  private readonly topicReserved: string;
  private readonly topicFailed: string;

  constructor(
    private readonly config: ConfigService,
    private readonly stockService: StockService,
  ) {
    const broker = this.config.getOrThrow<string>('KAFKA_BROKER');
    this.topicOrderCreated = this.config.getOrThrow<string>(
      'KAFKA_TOPIC_ORDER_CREATED',
    );
    this.topicReserved = this.config.getOrThrow<string>(
      'KAFKA_TOPIC_INVENTORY_RESERVED',
    );
    this.topicFailed = this.config.getOrThrow<string>(
      'KAFKA_TOPIC_INVENTORY_FAILED',
    );

    this.kafka = new Kafka({
      clientId: this.config.get('KAFKA_CLIENT_ID') ?? 'inventory-service',
      brokers: [broker],
      logLevel: logLevel.ERROR,
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: this.config.getOrThrow<string>('KAFKA_GROUP_ID'),
    });
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.topicOrderCreated,
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const payload = JSON.parse(
            message.value.toString(),
          ) as OrderCreatedEvent;
          if (payload.event !== 'order.created') return;
          await this.handleOrderCreated(payload);
        } catch (err) {
          this.logger.error(`Error procesando order.created: ${err}`);
        }
      },
    });

    this.connected = true;
    this.logger.log(`Escuchando ${this.topicOrderCreated}`);
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    await this.producer.disconnect();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async handleOrderCreated(payload: OrderCreatedEvent) {
    const lines = payload.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    const result = await this.stockService.reserveForOrder(
      payload.orderId,
      lines,
    );

    if (result.ok) {
      await this.producer.send({
        topic: this.topicReserved,
        messages: [
          {
            key: payload.orderId,
            value: JSON.stringify({
              event: 'inventory.reserved',
              orderId: payload.orderId,
              userId: payload.userId,
              userEmail: payload.userEmail,
              items: lines,
            }),
          },
        ],
      });
      this.logger.log(`reserved order=${payload.orderId}`);
      return;
    }

    await this.producer.send({
      topic: this.topicFailed,
      messages: [
        {
          key: payload.orderId,
          value: JSON.stringify({
            event: 'inventory.failed',
            orderId: payload.orderId,
            userId: payload.userId,
            userEmail: payload.userEmail,
            reason: result.reason,
          }),
        },
      ],
    });
    this.logger.warn(`failed order=${payload.orderId} reason=${result.reason}`);
  }
}
