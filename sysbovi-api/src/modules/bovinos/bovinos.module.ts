import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bovino } from '../../database/entities/bovino.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { PlanoLimiteGuard } from '../../common/guards/plano-limite.guard';
import { LotesPastosModule } from '../lotes-pastos/lotes-pastos.module';
import { PesagensModule } from '../pesagens/pesagens.module';
import { BovinosController } from './bovinos.controller';
import { BovinosService } from './bovinos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bovino, Tenant]),
    LotesPastosModule,
    PesagensModule,
  ],
  controllers: [BovinosController],
  providers: [BovinosService, PlanoLimiteGuard],
  exports: [BovinosService],
})
export class BovinosModule {}
