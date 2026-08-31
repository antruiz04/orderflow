import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogClient } from '../catalog/catalog.client';
import { KafkaService } from '../kafka/kafka.service';
import { lineTotal, money, toMoneyString } from '../common/money';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly kafkaService: KafkaService,
    private readonly catalogClient: CatalogClient,
  ) {}

  async create(
    userId: string,
    userEmail: string,
    dto: CreateOrderDto,
  ): Promise<Order> {
    const pricedItems: Array<{
      productId: number;
      quantity: number;
      unitPrice: string;
    }> = [];

    let total = money(0);

    for (const item of dto.items) {
      const product = await this.catalogClient.getActiveProduct(item.productId);
      const unitPrice = String(product.price);
      const line = lineTotal(unitPrice, item.quantity);

      if (line.lte(0)) {
        throw new BadRequestException(
          `Invalid price for product ${item.productId}`,
        );
      }

      pricedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: toMoneyString(money(unitPrice)),
      });
      total = total.plus(line);
    }

    const order = this.ordersRepository.create({
      userId,
      status: OrderStatus.PENDING,
      total: toMoneyString(total),
      items: pricedItems,
    });

    const saved = await this.ordersRepository.save(order);

    await this.kafkaService.publishOrderCreated({
      event: 'order.created',
      orderId: saved.id,
      userId: saved.userId,
      userEmail,
      total: saved.total,
      items: saved.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      createdAt: saved.createdAt.toISOString(),
    });

    return saved;
  }

  findMine(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findOneForUser(id: string, userId: string): Promise<Order | null> {
    return this.ordersRepository.findOne({ where: { id, userId } });
  }

  async applyInventoryResult(
    orderId: string,
    status: OrderStatus.CONFIRMED | OrderStatus.CANCELLED,
  ): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
    if (!order) return;
    if (order.status !== OrderStatus.PENDING) return;

    order.status = status;
    await this.ordersRepository.save(order);
  }
}
