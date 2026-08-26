import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

/** evita procesar el mismo order.created dos veces */
@Entity('processed_orders')
export class ProcessedOrder {
  @PrimaryColumn({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'varchar' })
  result: 'reserved' | 'failed';

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}
