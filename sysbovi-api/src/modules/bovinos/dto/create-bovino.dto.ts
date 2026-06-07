import {
  IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBovinoDto {
  @ApiProperty({ example: 'B-0042', description: 'Número de identificação (brinco) do animal' })
  @IsString()
  brinco: string;

  @ApiProperty({ example: 'Nelore', description: 'Raça do bovino' })
  @IsString()
  raca: string;

  @ApiProperty({ enum: ['M', 'F'], example: 'M', description: 'Sexo do animal' })
  @IsEnum(['M', 'F'], { message: 'Sexo deve ser M ou F.' })
  sexo: 'M' | 'F';

  @ApiProperty({ example: '2022-03-15', description: 'Data de nascimento (YYYY-MM-DD)' })
  @IsDateString()
  dataNascimento: string;

  @ApiProperty({ example: 280, description: 'Peso de entrada em kg (mínimo 1)' })
  @IsNumber()
  @Min(1)
  pesoEntrada: number;

  @ApiPropertyOptional({ example: '2023-01-10', description: 'Data de entrada na fazenda (YYYY-MM-DD); padrão: hoje' })
  @IsOptional()
  @IsDateString()
  dataEntrada?: string;

  @ApiPropertyOptional({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'UUID do lote/pasto onde o animal será alocado' })
  @IsOptional()
  @IsUUID()
  loteId?: string;
}
