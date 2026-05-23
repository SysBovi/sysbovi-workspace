import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pesagem } from '../../database/entities/pesagem.entity';
import { PesagensController } from './pesagens.controller';
import { PesagensService } from './pesagens.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pesagem])],
  controllers: [PesagensController],
  providers: [PesagensService],
  exports: [PesagensService],
})
export class PesagensModule {}
