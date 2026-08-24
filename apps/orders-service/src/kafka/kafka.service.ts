import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';

export type OrderCreatedEvent = {
  event: 'order.created';
  orderId: string;
  userId: string;
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
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;
  private readonly topicOrderCreated: string;

  constructor(private readonly config: ConfigService) {
    const broker = this.config.getOrThrow<string>('KAFKA_BROKER');
    this.topicOrderCreated = this.config.getOrThrow<string>(
      'KAFKA_TOPIC_ORDER_CREATED',
    );

    this.kafka = new Kafka({
      clientId: this.config.get('KAFKA_CLIENT_ID') ?? 'orders-service',
      brokers: [broker],
      logLevel: logLevel.ERROR,
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.connected = true;
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async publishOrderCreated(payload: OrderCreatedEvent): Promise<void> {
    await this.producer.send({
      topic: this.topicOrderCreated,
      messages: [
        {
          key: payload.orderId,
          value: JSON.stringify(payload),
        },
      ],
    });
  }
}
