import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AlertaMassaForrageira, MetodoCriacao } from '../../../database/entities/lote-pasto.entity';

export class UpdateLotePastoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidade?: number;

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

  @IsOptional()
  @IsEnum(['NORMAL', 'BAIXA', 'CRITICA'])
  alertaMassaForrageira?: AlertaMassaForrageira;
}

export class RegistrarRodizioDto {
  @IsOptional()
  @IsDateString()
  dataRodizio?: string;
}
