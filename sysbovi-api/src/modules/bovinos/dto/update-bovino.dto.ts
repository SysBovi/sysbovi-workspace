import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { StatusBovino, StatusSaudeBovino } from '../../../database/entities/bovino.entity';

export class UpdateBovinoDto {
  @IsOptional()
  @IsString()
  brinco?: string;

  @IsOptional()
  @IsString()
  raca?: string;

  @IsOptional()
  @IsEnum(['ATIVO', 'INATIVO', 'VENDIDO', 'MORTO'])
  status?: StatusBovino;

  @IsOptional()
  @IsEnum(['SAUDAVEL', 'EM_TRATAMENTO', 'OBSERVACAO'])
  statusSaude?: StatusSaudeBovino;

  @IsOptional()
  @IsUUID()
  loteId?: string | null;
}
