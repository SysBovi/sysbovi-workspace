import { IsNumber, IsUUID, Min } from 'class-validator';

export class AdicionarEstoqueDto {
  @IsNumber()
  @Min(0.01)
  quantidade: number;
}

export class UsarInsumoDto {
  @IsUUID()
  loteId: string;

  @IsNumber()
  @Min(0.01)
  quantidadeUtilizada: number;
}
