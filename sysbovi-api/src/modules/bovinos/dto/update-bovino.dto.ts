import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusBovino, StatusSaudeBovino } from '../../../database/entities/bovino.entity';

export class UpdateBovinoDto {
  @ApiPropertyOptional({ example: 'B-0042', description: 'Novo número de brinco' })
  @IsOptional()
  @IsString()
  brinco?: string;

  @ApiPropertyOptional({ example: 'Angus', description: 'Raça do bovino' })
  @IsOptional()
  @IsString()
  raca?: string;

  @ApiPropertyOptional({ enum: StatusBovino, example: StatusBovino.ATIVO, description: 'Status do animal' })
  @IsOptional()
  @IsEnum(StatusBovino)
  status?: StatusBovino;

  @ApiPropertyOptional({ enum: StatusSaudeBovino, example: StatusSaudeBovino.SAUDAVEL, description: 'Status de saúde' })
  @IsOptional()
  @IsEnum(StatusSaudeBovino)
  statusSaude?: StatusSaudeBovino;

  @ApiPropertyOptional({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', nullable: true, description: 'UUID do lote; null para remover do lote atual' })
  @IsOptional()
  @IsUUID()
  loteId?: string | null;
}
