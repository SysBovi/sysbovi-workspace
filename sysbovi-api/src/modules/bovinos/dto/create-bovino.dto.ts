import {
  IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min,
} from 'class-validator';

export class CreateBovinoDto {
  @IsString()
  brinco: string;

  @IsString()
  raca: string;

  @IsEnum(['M', 'F'], { message: 'Sexo deve ser M ou F.' })
  sexo: 'M' | 'F';

  @IsDateString()
  dataNascimento: string;

  @IsNumber()
  @Min(1)
  pesoEntrada: number;

  @IsOptional()
  @IsDateString()
  dataEntrada?: string;

  @IsOptional()
  @IsUUID()
  loteId?: string;
}
