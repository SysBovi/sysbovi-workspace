import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TipoInsumo } from '../../../database/entities/insumo.entity';

export class CreateInsumoDto {
  @IsString()
  nome: string;

  @IsEnum(['VACINA', 'SUPLEMENTO', 'MEDICAMENTO', 'MINERAL'])
  tipo: TipoInsumo;

  @IsString()
  unidade: string;

  @IsNumber()
  @Min(0)
  quantidadeAtual: number;

  @IsNumber()
  @Min(0)
  custoUnitario: number;

  @IsNumber()
  @Min(0)
  nivelMinimo: number;

  @IsOptional()
  @IsDateString()
  validade?: string;
}
