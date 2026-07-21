import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Carga el archivo .env de esta carpeta
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Conexión a auth_db (solo esta base — database-per-service)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('POSTGRES_HOST'),
        port: Number(config.get('POSTGRES_PORT') ?? 5432),
        username: config.getOrThrow<string>('POSTGRES_USER'),
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: config.getOrThrow<string>('AUTH_DB_NAME'),
        entities: [User],
        // DEV ONLY: TypeORM crea/actualiza tablas al arrancar según las entidades.
        // En producción esto es peligroso (puede alterar o borrar columnas con datos).
        // Roadmap: migraciones versionadas (typeorm migration:generate / migration:run).
        synchronize: true,
      }),
    }),

    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
