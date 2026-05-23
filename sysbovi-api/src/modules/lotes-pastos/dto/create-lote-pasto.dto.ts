import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MetodoCriacao } from '../../../database/entities/lote-pasto.entity';

export class CreateLotePastoDto {
  @IsString()
  nome: string;

  @IsInt()
  @Min(1)
  capacidade: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  areaHectares?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  diasDescanso?: number;

  @IsOptional()
  @IsEnum(['LIVRE_PASTO', 'SEMI_CONFINADO', 'CONFINADO'])
  metodoCriacao?: MetodoCriacao;
}
