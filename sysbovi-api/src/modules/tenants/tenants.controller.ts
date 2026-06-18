import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';
import { SolicitarUpgradeDto } from './dto/solicitar-upgrade.dto';

@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Dados da fazenda', description: 'Retorna os dados do tenant autenticado: nome da fazenda, plano ativo, status da conta e data de vencimento.' })
  @ApiResponse({ status: 200, description: 'Dados do tenant.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  findMe(@CurrentUser() user: any) {
    return this.service.findMe(user.tenantId);
  }

  @Post('me/solicitar-upgrade')
  @HttpCode(204)
  @Roles('ADMIN_FAZENDA')
  @ApiOperation({ summary: 'Solicitar upgrade de plano', description: 'Registra a solicitação de upgrade para um plano superior. O backoffice SaaS processa a solicitação manualmente.' })
  @ApiResponse({ status: 204, description: 'Solicitação registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Plano desejado inválido.' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_FAZENDA pode solicitar upgrade.' })
  solicitarUpgrade(
    @Body() dto: SolicitarUpgradeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.solicitarUpgrade(user.tenantId, dto.planoDesejado);
  }
}
