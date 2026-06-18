import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insumo } from '../../database/entities/insumo.entity';
import { UsoInsumo } from '../../database/entities/uso-insumo.entity';
import { InsumosController } from './insumos.controller';
import { InsumosService } from './insumos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Insumo, UsoInsumo])],
  controllers: [InsumosController],
  providers: [InsumosService],
  exports: [InsumosService],
})
export class InsumosModule {}
