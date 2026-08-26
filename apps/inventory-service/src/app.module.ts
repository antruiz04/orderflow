import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { KafkaModule } from './kafka/kafka.module';
import { ProcessedOrder } from './stock/processed-order.entity';
import { StockItem } from './stock/stock.entity';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('POSTGRES_HOST'),
        port: Number(config.get('POSTGRES_PORT') ?? 5433),
        username: config.getOrThrow<string>('POSTGRES_USER'),
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: config.getOrThrow<string>('INVENTORY_DB_NAME'),
        entities: [StockItem, ProcessedOrder],
        synchronize: true,
      }),
    }),
    StockModule,
    KafkaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
