import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { AdicionarEstoqueDto, UsarInsumoDto } from './dto/usar-insumo.dto';

@ApiTags('Insumos')
@ApiBearerAuth('access-token')
@Controller('insumos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')
export class InsumosController {
  constructor(private readonly service: InsumosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar insumos', description: 'Retorna todos os insumos do tenant com quantidade atual, nível mínimo e status (NORMAL, BAIXO, CRITICO).' })
  @ApiResponse({ status: 200, description: 'Lista de insumos com status de estoque.' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar insumo', description: 'Retorna os dados completos de um insumo específico.' })
  @ApiResponse({ status: 200, description: 'Dados do insumo.' })
  @ApiResponse({ status: 404, description: 'Insumo não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Histórico de uso do insumo', description: 'Retorna o registro de todas as utilizações do insumo, com quantidade usada, lote e data.' })
  @ApiResponse({ status: 200, description: 'Histórico de uso.' })
  @ApiResponse({ status: 404, description: 'Insumo não encontrado.' })
  getHistorico(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.getHistorico(id, user.tenantId);
  }

  @Post()
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Cadastrar insumo', description: 'Registra um novo insumo no estoque (vacina, suplemento, medicamento ou mineral).' })
  @ApiResponse({ status: 201, description: 'Insumo cadastrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() dto: CreateInsumoDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Put(':id')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Atualizar insumo', description: 'Atualiza nome, tipo ou nível mínimo do insumo.' })
  @ApiResponse({ status: 200, description: 'Insumo atualizado.' })
  @ApiResponse({ status: 404, description: 'Insumo não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsumoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Remover insumo', description: 'Remove o insumo do estoque permanentemente.' })
  @ApiResponse({ status: 204, description: 'Insumo removido.' })
  @ApiResponse({ status: 404, description: 'Insumo não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }

  @Patch(':id/adicionar')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Adicionar estoque', description: 'Incrementa a quantidade do insumo em estoque (entrada de nota fiscal, por exemplo).' })
  @ApiResponse({ status: 200, description: 'Estoque atualizado.' })
  @ApiResponse({ status: 404, description: 'Insumo não encontrado.' })
  adicionarEstoque(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdicionarEstoqueDto,
    @CurrentUser() user: any,
  ) {
    return this.service.adicionarEstoque(id, dto, user.tenantId);
  }

  @Post(':id/usar')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({
    summary: 'Registrar uso de insumo',
    description:
      'Debita a quantidade usada do estoque e distribui o custo por cabeça para todos os bovinos ativos do lote. ' +
      'Aplica fator de perda conforme o método de criação (LIVRE_PASTO=1.05, CONFINADO=1.00). ' +
      'Lança exceção se o estoque for insuficiente.',
  })
  @ApiResponse({ status: 201, description: 'Uso registrado e custo distribuído.' })
  @ApiResponse({ status: 400, description: 'Quantidade insuficiente em estoque.' })
  @ApiResponse({ status: 404, description: 'Insumo ou lote não encontrado.' })
  usarInsumo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UsarInsumoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.usarInsumo(id, dto, user.tenantId);
  }
}
