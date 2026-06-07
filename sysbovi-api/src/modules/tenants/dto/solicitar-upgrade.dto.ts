import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitarUpgradeDto {
  @ApiProperty({ enum: ['PREMIUM', 'EMPRESARIAL'], example: 'PREMIUM', description: 'Plano desejado para upgrade' })
  @IsString()
  @IsIn(['PREMIUM', 'EMPRESARIAL'])
  planoDesejado: string;
}
