import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Estatísticas do rebanho',
    description: 'Retorna métricas consolidadas do tenant: total de cabeças, GMD médio, peso médio, insumos em alerta e pastos superlotados. Resultado cacheado no Redis por 5 minutos.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas consolidadas do rebanho.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user.tenantId);
  }
}
