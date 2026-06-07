import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusConta } from '../../../database/entities/tenant.entity';

export class AtualizarStatusTenantDto {
  @ApiProperty({ enum: StatusConta, example: StatusConta.ATIVA, description: 'Novo status da conta do tenant' })
  @IsEnum(StatusConta)
  statusConta: StatusConta;
}
