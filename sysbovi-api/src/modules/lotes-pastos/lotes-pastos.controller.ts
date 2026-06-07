import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LotesPastosService } from './lotes-pastos.service';
import { CreateLotePastoDto } from './dto/create-lote-pasto.dto';
import { RegistrarRodizioDto, UpdateLotePastoDto } from './dto/update-lote-pasto.dto';
import { SetCustoDiarioDto } from './dto/set-custo-diario.dto';

@ApiTags('Pastos')
@ApiBearerAuth('access-token')
@Controller('pastos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')
export class LotesPastosController {
  constructor(private readonly service: LotesPastosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar lotes/pastos', description: 'Retorna todos os lotes e pastagens do tenant com ocupação atual e status.' })
  @ApiResponse({ status: 200, description: 'Lista de lotes e pastagens.' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar lote/pasto', description: 'Retorna os dados completos de um lote, incluindo bovinos alocados e custo diário vigente.' })
  @ApiResponse({ status: 200, description: 'Dados do lote.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Criar lote/pasto', description: 'Cadastra um novo lote ou pastagem com capacidade definida.' })
  @ApiResponse({ status: 201, description: 'Lote criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateLotePastoDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Put(':id')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Atualizar lote/pasto', description: 'Atualiza nome, capacidade ou tipo do lote.' })
  @ApiResponse({ status: 200, description: 'Lote atualizado.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLotePastoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Patch(':id/rodizio')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Registrar rodízio de pasto', description: 'Move todos os bovinos de um lote para outro, atualizando a ocupação de ambos.' })
  @ApiResponse({ status: 200, description: 'Rodízio registrado. Bovinos movidos para o novo lote.' })
  @ApiResponse({ status: 404, description: 'Lote de origem ou destino não encontrado.' })
  registrarRodizio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarRodizioDto,
    @CurrentUser() user: any,
  ) {
    return this.service.registrarRodizio(id, dto, user.tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Remover lote/pasto', description: 'Remove o lote permanentemente. Só é possível se não houver bovinos alocados.' })
  @ApiResponse({ status: 200, description: 'Lote removido.' })
  @ApiResponse({ status: 400, description: 'Lote possui bovinos alocados e não pode ser removido.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }

  @Get(':id/custo-diario')
  @ApiOperation({ summary: 'Consultar custo diário', description: 'Retorna o valor da diária vigente para o lote (alimentação, mão de obra, etc.).' })
  @ApiResponse({ status: 200, description: 'Valor da diária em R$/cabeça/dia.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  getCustoDiario(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.getCustoDiario(id, user.tenantId).then(v => ({ valorDiaria: v }));
  }

  @Post(':id/custo-diario')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Definir custo diário', description: 'Define ou atualiza o custo diário por cabeça do lote. Usado no cálculo de margem do AvaliaVenda.' })
  @ApiResponse({ status: 201, description: 'Custo diário registrado.' })
  @ApiResponse({ status: 404, description: 'Lote não encontrado.' })
  setCustoDiario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetCustoDiarioDto,
    @CurrentUser() user: any,
  ) {
    return this.service.setCustoDiario(id, dto.valorDiaria, user.tenantId);
  }
}
