import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AvaliaVendaService } from './avalia-venda.service';

@Controller('avalia-venda')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
export class AvaliaVendaController {
  constructor(private readonly service: AvaliaVendaService) {}

  @Get()
  avaliar(@CurrentUser() user: any) {
    return this.service.avaliar(user.tenantId);
  }
}
