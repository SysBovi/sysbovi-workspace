import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembroEquipe } from '../../database/entities/membro-equipe.entity';
import { EquipeController } from './equipe.controller';
import { EquipeService } from './equipe.service';

@Module({
  imports: [TypeOrmModule.forFeature([MembroEquipe])],
  controllers: [EquipeController],
  providers: [EquipeService],
})
export class EquipeModule {}
