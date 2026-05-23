import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Patch, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BackofficeService } from './backoffice.service';
import { AtualizarFaturaDto } from './dto/atualizar-fatura.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('UA')
export class BackofficeController {
  constructor(private readonly service: BackofficeService) {}

  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('tenants')
  listTenants() {
    return this.service.listTenants();
  }

  @Get('tenants/:id')
  findTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findTenant(id);
  }

  @Get('faturas')
  listFaturas(@Query('tenantId') tenantId?: string) {
    return this.service.listFaturas(tenantId);
  }

  @Patch('faturas/:id')
  atualizarFatura(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarFaturaDto,
  ) {
    return this.service.atualizarFatura(id, dto);
  }

  @Get('logs')
  listLogs(@Query('tenantId') tenantId?: string) {
    return this.service.listLogs(tenantId);
  }
}
