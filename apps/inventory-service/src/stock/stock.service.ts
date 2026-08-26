import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProcessedOrder } from './processed-order.entity';
import { StockItem } from './stock.entity';

export type OrderLine = { productId: number; quantity: number };

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItem)
    private readonly stockRepo: Repository<StockItem>,
    @InjectRepository(ProcessedOrder)
    private readonly processedRepo: Repository<ProcessedOrder>,
    private readonly dataSource: DataSource,
  ) {}

  list(): Promise<StockItem[]> {
    return this.stockRepo.find({ order: { productId: 'ASC' } });
  }

  async upsert(productId: number, quantity: number): Promise<StockItem> {
    let row = await this.stockRepo.findOne({ where: { productId } });
    if (!row) {
      row = this.stockRepo.create({ productId, quantity });
    } else {
      row.quantity = quantity;
    }
    return this.stockRepo.save(row);
  }

  async findProcessed(orderId: string): Promise<ProcessedOrder | null> {
    return this.processedRepo.findOne({ where: { orderId } });
  }

  /**
   * Reserva stock para un pedido. Todo-or-nothing.
   * Si ya se procesó ese orderId, no vuelve a descontar (idempotencia).
   */
  async reserveForOrder(
    orderId: string,
    items: OrderLine[],
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    const existing = await this.findProcessed(orderId);
    if (existing) {
      return existing.result === 'reserved'
        ? { ok: true }
        : { ok: false, reason: 'already_failed' };
    }

    return this.dataSource.transaction(async (manager) => {
      // agrupar por productId por si el pedido trae líneas repetidas
      const needed = new Map<number, number>();
      for (const item of items) {
        needed.set(
          item.productId,
          (needed.get(item.productId) ?? 0) + item.quantity,
        );
      }

      // un solo pase: lock + validar + descontar en memoria
      // el save de stock solo al final → all-or-nothing sin 2ª query
      const toSave: StockItem[] = [];

      for (const [productId, qty] of needed) {
        const stock = await manager.findOne(StockItem, {
          where: { productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!stock || stock.quantity < qty) {
          await manager.save(
            manager.create(ProcessedOrder, {
              orderId,
              result: 'failed',
            }),
          );
          const available = stock?.quantity ?? 0;
          return {
            ok: false as const,
            reason: `insufficient_stock productId=${productId} need=${qty} have=${available}`,
          };
        }

        stock.quantity -= qty;
        toSave.push(stock);
      }

      await manager.save(toSave);
      await manager.save(
        manager.create(ProcessedOrder, {
          orderId,
          result: 'reserved',
        }),
      );

      return { ok: true as const };
    });
  }
}
