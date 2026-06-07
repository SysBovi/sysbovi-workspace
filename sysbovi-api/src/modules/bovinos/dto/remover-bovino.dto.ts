import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MotivoRemocao {
  INATIVO = 'INATIVO',
  VENDIDO = 'VENDIDO',
  MORTO   = 'MORTO',
}

export class RemoverBovinoDto {
  @ApiProperty({
    enum: MotivoRemocao,
    description: 'Motivo da remoção do animal do rebanho ativo',
    example: MotivoRemocao.VENDIDO,
  })
  @IsEnum(MotivoRemocao)
  motivo: MotivoRemocao;
}
