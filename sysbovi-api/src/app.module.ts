import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { LotesPastosModule } from './modules/lotes-pastos/lotes-pastos.module';
import { BovinosModule } from './modules/bovinos/bovinos.module';
import { PesagensModule } from './modules/pesagens/pesagens.module';
import { InsumosModule } from './modules/insumos/insumos.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AvaliaVendaModule } from './modules/avalia-venda/avalia-venda.module';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { EquipeModule } from './modules/equipe/equipe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'sysbovi_user'),
        password: config.get<string>('DB_PASS', 'sysbovi_password'),
        database: config.get<string>('DB_NAME', 'sysbovi_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    RedisModule,
    AuthModule,
    TenantsModule,
    LotesPastosModule,
    BovinosModule,
    PesagensModule,
    InsumosModule,
    DashboardModule,
    AvaliaVendaModule,
    BackofficeModule,
    EquipeModule,
  ],
})
export class AppModule {}
