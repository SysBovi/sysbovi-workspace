import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetCustoDiarioDto {
  @ApiProperty({ example: 3.50, description: 'Custo diário por animal em R$ (mínimo 0)' })
  @IsNumber()
  @Min(0)
  valorDiaria: number;
}
