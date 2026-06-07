import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotePasto } from '../../database/entities/lote-pasto.entity';
import { CustoDiariaHistorico } from '../../database/entities/custo-diaria-historico.entity';
import { LotesPastosController } from './lotes-pastos.controller';
import { LotesPastosService } from './lotes-pastos.service';

@Module({
  imports: [TypeOrmModule.forFeature([LotePasto, CustoDiariaHistorico])],
  controllers: [LotesPastosController],
  providers: [LotesPastosService],
  exports: [LotesPastosService],
})
export class LotesPastosModule {}
