import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bovino } from '../../database/entities/bovino.entity';
import { ParametroZootecnico } from '../../database/entities/parametro-zootecnico.entity';
import { CustoDiariaHistorico } from '../../database/entities/custo-diaria-historico.entity';
import { AvaliaVendaController } from './avalia-venda.controller';
import { AvaliaVendaService } from './avalia-venda.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bovino, ParametroZootecnico, CustoDiariaHistorico])],
  controllers: [AvaliaVendaController],
  providers: [AvaliaVendaService],
})
export class AvaliaVendaModule {}
