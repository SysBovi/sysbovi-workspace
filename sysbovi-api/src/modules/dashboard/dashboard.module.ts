import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bovino } from '../../database/entities/bovino.entity';
import { Insumo } from '../../database/entities/insumo.entity';
import { LotePasto } from '../../database/entities/lote-pasto.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bovino, Insumo, LotePasto])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
