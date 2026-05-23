import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TipoInsumo } from '../../../database/entities/insumo.entity';

export class UpdateInsumoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEnum(['VACINA', 'SUPLEMENTO', 'MEDICAMENTO', 'MINERAL'])
  tipo?: TipoInsumo;

  @IsOptional()
  @IsString()
  unidade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custoUnitario?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nivelMinimo?: number;

  @IsOptional()
  @IsDateString()
  validade?: string | null;
}
