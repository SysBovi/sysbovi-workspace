import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PesagensService } from './pesagens.service';
import { CreatePesagemDto } from './dto/create-pesagem.dto';

@ApiTags('Pesagens')
@ApiBearerAuth('access-token')
@Controller('bovinos/:bovinoId/pesagens')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')
export class PesagensController {
  constructor(private readonly service: PesagensService) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de pesagens', description: 'Retorna todas as pesagens registradas para o animal, em ordem cronológica, com GMD calculado entre cada pesagem.' })
  @ApiResponse({ status: 200, description: 'Histórico de pesagens do animal.' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado.' })
  findAll(
    @Param('bovinoId', ParseUUIDPipe) bovinoId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findByBovino(bovinoId, user.tenantId);
  }

  @Post()
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Registrar pesagem', description: 'Registra uma nova pesagem para o animal. O GMD é recalculado automaticamente em relação à pesagem anterior.' })
  @ApiResponse({ status: 201, description: 'Pesagem registrada.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado.' })
  registrar(
    @Param('bovinoId', ParseUUIDPipe) bovinoId: string,
    @Body() dto: CreatePesagemDto,
    @CurrentUser() user: any,
  ) {
    return this.service.registrar(dto, bovinoId, user.tenantId);
  }
}
