import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PlanoGuard, PlanosPermitidos } from '../../common/guards/plano.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AvaliaVendaService } from './avalia-venda.service';

@ApiTags('Avalia Venda')
@ApiBearerAuth('access-token')
@Controller('avalia-venda')
@UseGuards(JwtAuthGuard, RolesGuard, PlanoGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
@PlanosPermitidos('PREMIUM', 'EMPRESARIAL')
export class AvaliaVendaController {
  constructor(private readonly service: AvaliaVendaService) {}

  @Get()
  @ApiOperation({
    summary: 'Analisar rebanho para venda',
    description:
      'Executa o motor de análise financeira para todos os bovinos ativos do tenant. ' +
      'Para cada animal calcula: arrobas estimadas, receita bruta, custo acumulado, margem e recomendação (VENDER_AGORA ou AGUARDAR_ENGORDA). ' +
      'Disponível apenas nos planos PREMIUM e EMPRESARIAL para os papéis ADMIN_FAZENDA e ESPECIALISTA.',
  })
  @ApiResponse({ status: 200, description: 'Lista de análises por animal com recomendação de venda.' })
  @ApiResponse({ status: 403, description: 'Plano não inclui o módulo AvaliaVenda (requer PREMIUM ou EMPRESARIAL).' })
  avaliar(@CurrentUser() user: any) {
    return this.service.avaliar(user.tenantId);
  }
}
