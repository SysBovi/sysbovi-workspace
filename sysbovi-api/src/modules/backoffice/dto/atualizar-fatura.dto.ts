import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { StatusPagamento } from '../../../database/entities/fatura-saas.entity';

export class AtualizarFaturaDto {
  @IsEnum(['PAGO', 'PENDENTE', 'ATRASADO', 'CANCELADO'])
  statusPagamento: StatusPagamento;

  @IsOptional()
  @IsDateString()
  dataPagamento?: string;
}
