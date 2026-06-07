import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoInsumo } from '../../../database/entities/insumo.entity';

export class CreateInsumoDto {
  @ApiProperty({ example: 'Vacina FMD', description: 'Nome do insumo' })
  @IsString()
  nome: string;

  @ApiProperty({ enum: TipoInsumo, example: TipoInsumo.VACINA, description: 'Tipo do insumo' })
  @IsEnum(TipoInsumo)
  tipo: TipoInsumo;

  @ApiProperty({ example: 'doses', description: 'Unidade de medida (ex: kg, L, doses)' })
  @IsString()
  unidade: string;

  @ApiProperty({ example: 100, description: 'Quantidade em estoque no momento do cadastro' })
  @IsNumber()
  @Min(0)
  quantidadeAtual: number;

  @ApiProperty({ example: 12.5, description: 'Custo por unidade em R$' })
  @IsNumber()
  @Min(0)
  custoUnitario: number;

  @ApiProperty({ example: 20, description: 'Nível mínimo de estoque para alerta' })
  @IsNumber()
  @Min(0)
  nivelMinimo: number;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Data de validade do lote (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  validade?: string;
}
