import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoInsumo } from '../../../database/entities/insumo.entity';

export class UpdateInsumoDto {
  @ApiPropertyOptional({ example: 'Vacina Raiva', description: 'Novo nome do insumo' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ enum: TipoInsumo, example: TipoInsumo.MEDICAMENTO, description: 'Tipo do insumo' })
  @IsOptional()
  @IsEnum(TipoInsumo)
  tipo?: TipoInsumo;

  @ApiPropertyOptional({ example: 'frascos', description: 'Unidade de medida' })
  @IsOptional()
  @IsString()
  unidade?: string;

  @ApiPropertyOptional({ example: 15.0, description: 'Custo por unidade em R$' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  custoUnitario?: number;

  @ApiPropertyOptional({ example: 10, description: 'Nível mínimo de estoque para alerta' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nivelMinimo?: number;

  @ApiPropertyOptional({ example: '2026-06-30', nullable: true, description: 'Nova data de validade; null para remover' })
  @IsOptional()
  @IsDateString()
  validade?: string | null;
}
