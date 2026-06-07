import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AtualizarPlanoTenantDto {
  @ApiProperty({ example: 2, description: 'ID numérico do plano de assinatura (mínimo 1)' })
  @IsInt()
  @Min(1)
  planoId: number;
}
