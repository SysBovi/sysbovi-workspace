import { IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePesagemDto {
  @ApiProperty({ example: 320.5, description: 'Peso do animal em kg (mínimo 1)' })
  @IsNumber()
  @Min(1)
  peso: number;

  @ApiPropertyOptional({ example: '2024-06-01', description: 'Data da pesagem (YYYY-MM-DD); padrão: hoje' })
  @IsOptional()
  @IsDateString()
  dataPesagem?: string;
}
