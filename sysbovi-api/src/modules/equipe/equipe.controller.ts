import {
  Body, Controller, Delete, Get, HttpCode,
  Param, ParseUUIDPipe, Post, Put, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PlanoGuard, PlanosPermitidos } from '../../common/guards/plano.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EquipeService } from './equipe.service';
import { CreateMembroDto } from './dto/create-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';

@ApiTags('Equipe')
@ApiBearerAuth('access-token')
@Controller('equipe')
@UseGuards(JwtAuthGuard, RolesGuard, PlanoGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')
@PlanosPermitidos('EMPRESARIAL')
export class EquipeController {
  constructor(private readonly service: EquipeService) {}

  @Get()
  @ApiOperation({ summary: 'Listar membros da equipe', description: 'Retorna todos os membros técnicos da fazenda. Disponível apenas no plano EMPRESARIAL.' })
  @ApiResponse({ status: 200, description: 'Lista de membros da equipe.' })
  @ApiResponse({ status: 403, description: 'Plano não permite acesso à gestão de equipe.' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Post()
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Adicionar membro', description: 'Cadastra um novo membro na equipe técnica da fazenda.' })
  @ApiResponse({ status: 201, description: 'Membro adicionado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Plano não permite acesso à gestão de equipe.' })
  create(@Body() dto: CreateMembroDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Put(':id')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Atualizar membro', description: 'Atualiza os dados de um membro da equipe.' })
  @ApiResponse({ status: 200, description: 'Membro atualizado.' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembroDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN_FAZENDA')
  @ApiOperation({ summary: 'Remover membro', description: 'Remove um membro da equipe. Restrito ao papel ADMIN_FAZENDA.' })
  @ApiResponse({ status: 204, description: 'Membro removido.' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_FAZENDA pode remover membros.' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }
}
