import { IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdicionarEstoqueDto {
  @ApiProperty({ example: 50, description: 'Quantidade a adicionar ao estoque (mínimo 0.01)' })
  @IsNumber()
  @Min(0.01)
  quantidade: number;
}

export class UsarInsumoDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'UUID do lote/pasto que recebe o insumo' })
  @IsUUID()
  loteId: string;

  @ApiProperty({ example: 5.5, description: 'Quantidade utilizada (mínimo 0.01)' })
  @IsNumber()
  @Min(0.01)
  quantidadeUtilizada: number;
}
