import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoCriacao } from '../../../database/entities/lote-pasto.entity';

export class CreateLotePastoDto {
  @ApiProperty({ example: 'Pasto Norte', description: 'Nome do lote ou pasto' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 50, description: 'Capacidade máxima em número de animais (mínimo 1)' })
  @IsInt()
  @Min(1)
  capacidade: number;

  @ApiPropertyOptional({ example: 12.5, description: 'Área em hectares' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaHectares?: number;

  @ApiPropertyOptional({ example: 30, description: 'Dias de descanso entre rodízios (mínimo 1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  diasDescanso?: number;

  @ApiPropertyOptional({ enum: MetodoCriacao, example: MetodoCriacao.LIVRE_PASTO, description: 'Método de criação' })
  @IsOptional()
  @IsEnum(MetodoCriacao)
  metodoCriacao?: MetodoCriacao;
}
