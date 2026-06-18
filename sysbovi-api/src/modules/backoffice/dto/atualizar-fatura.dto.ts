import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusPagamento } from '../../../database/entities/fatura-saas.entity';

export class AtualizarFaturaDto {
  @ApiProperty({ enum: StatusPagamento, example: StatusPagamento.PAGO, description: 'Novo status de pagamento da fatura' })
  @IsEnum(StatusPagamento)
  statusPagamento: StatusPagamento;

  @ApiPropertyOptional({ example: '2024-06-05', description: 'Data efetiva do pagamento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dataPagamento?: string;
}
