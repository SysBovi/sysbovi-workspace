import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BackofficeService } from './backoffice.service';
import { AtualizarFaturaDto } from './dto/atualizar-fatura.dto';
import { AtualizarStatusTenantDto } from './dto/atualizar-status-tenant.dto';
import { AtualizarPlanoTenantDto } from './dto/atualizar-plano-tenant.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('UA')
export class BackofficeController {
  constructor(private readonly service: BackofficeService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard do backoffice', description: 'Retorna métricas SaaS: MRR total, total de tenants ativos, inadimplentes e em trial.' })
  @ApiResponse({ status: 200, description: 'Métricas consolidadas do SaaS.' })
  @ApiResponse({ status: 403, description: 'Restrito ao papel UA (super administrador).' })
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'Listar tenants', description: 'Retorna todos os tenants cadastrados com plano, status da conta e data de vencimento.' })
  @ApiResponse({ status: 200, description: 'Lista de tenants.' })
  listTenants() {
    return this.service.listTenants();
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Detalhar tenant', description: 'Retorna os dados completos de um tenant específico, incluindo usuários, plano e histórico de faturas.' })
  @ApiResponse({ status: 200, description: 'Dados do tenant.' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  findTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findTenant(id);
  }

  @Get('faturas')
  @ApiOperation({ summary: 'Listar faturas', description: 'Retorna faturas de todos os tenants ou de um tenant específico quando `tenantId` é informado.' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'UUID do tenant para filtrar faturas.' })
  @ApiResponse({ status: 200, description: 'Lista de faturas.' })
  listFaturas(@Query('tenantId') tenantId?: string) {
    return this.service.listFaturas(tenantId);
  }

  @Patch('faturas/:id')
  @ApiOperation({ summary: 'Atualizar fatura', description: 'Registra pagamento ou marca fatura como atrasada. Aciona bloqueio/desbloqueio automático da conta do tenant conforme o novo status.' })
  @ApiResponse({ status: 200, description: 'Fatura atualizada. Conta do tenant ajustada automaticamente.' })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada.' })
  atualizarFatura(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarFaturaDto,
  ) {
    return this.service.atualizarFatura(id, dto);
  }

  @Patch('tenants/:id/plano')
  @ApiOperation({ summary: 'Alterar plano do tenant', description: 'Migra o tenant para um plano diferente. Limites de cabeças e funcionalidades são ajustados imediatamente.' })
  @ApiResponse({ status: 200, description: 'Plano atualizado.' })
  @ApiResponse({ status: 404, description: 'Tenant ou plano não encontrado.' })
  atualizarPlano(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarPlanoTenantDto,
  ) {
    return this.service.atualizarPlanoTenant(id, dto.planoId);
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Alterar status do tenant', description: 'Bloqueia ou reativa manualmente a conta de um tenant (ATIVA, INADIMPLENTE, BLOQUEADA).' })
  @ApiResponse({ status: 200, description: 'Status da conta atualizado.' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado.' })
  atualizarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarStatusTenantDto,
  ) {
    return this.service.atualizarStatusTenant(id, dto.statusConta);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Listar logs de auditoria', description: 'Retorna o histórico de eventos do sistema (bloqueios, reativações, upgrades). Filtrável por tenant.' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'UUID do tenant para filtrar logs.' })
  @ApiResponse({ status: 200, description: 'Lista de logs de auditoria.' })
  listLogs(@Query('tenantId') tenantId?: string) {
    return this.service.listLogs(tenantId);
  }
}
