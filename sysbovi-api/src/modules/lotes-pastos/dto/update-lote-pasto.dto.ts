import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlertaMassaForrageira, MetodoCriacao } from '../../../database/entities/lote-pasto.entity';

export class UpdateLotePastoDto {
  @ApiPropertyOptional({ example: 'Pasto Sul', description: 'Novo nome do lote' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ example: 60, description: 'Nova capacidade máxima em número de animais' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacidade?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Área em hectares' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaHectares?: number;

  @ApiPropertyOptional({ example: 45, description: 'Dias de descanso entre rodízios' })
  @IsOptional()
  @IsInt()
  @Min(1)
  diasDescanso?: number;

  @ApiPropertyOptional({ enum: MetodoCriacao, example: MetodoCriacao.SEMI_CONFINADO, description: 'Método de criação' })
  @IsOptional()
  @IsEnum(MetodoCriacao)
  metodoCriacao?: MetodoCriacao;

  @ApiPropertyOptional({ enum: AlertaMassaForrageira, example: AlertaMassaForrageira.NORMAL, description: 'Status de alerta de massa forrageira' })
  @IsOptional()
  @IsEnum(AlertaMassaForrageira)
  alertaMassaForrageira?: AlertaMassaForrageira;
}

export class RegistrarRodizioDto {
  @ApiPropertyOptional({ example: '2024-07-01', description: 'Data do rodízio (YYYY-MM-DD); padrão: hoje' })
  @IsOptional()
  @IsDateString()
  dataRodizio?: string;
}
