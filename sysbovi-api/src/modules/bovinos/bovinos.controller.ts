import {
  Body, Controller, Delete, Get, HttpCode,
  Param, ParseUUIDPipe, Post, Put, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PlanoLimiteGuard } from '../../common/guards/plano-limite.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BovinosService } from './bovinos.service';
import { CreateBovinoDto } from './dto/create-bovino.dto';
import { UpdateBovinoDto } from './dto/update-bovino.dto';
import { RemoverBovinoDto } from './dto/remover-bovino.dto';

@ApiTags('Bovinos')
@ApiBearerAuth('access-token')
@Controller('bovinos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_FAZENDA', 'ESPECIALISTA', 'COMUM')
export class BovinosController {
  constructor(private readonly service: BovinosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar rebanho', description: 'Retorna todos os animais ativos do tenant, com lote, pesagens e status de saúde.' })
  @ApiResponse({ status: 200, description: 'Lista de bovinos do rebanho.' })
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar animal', description: 'Retorna os dados completos de um animal específico, incluindo histórico de pesagens.' })
  @ApiResponse({ status: 200, description: 'Dados do animal.' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @UseGuards(PlanoLimiteGuard)
  @ApiOperation({ summary: 'Cadastrar animal', description: 'Registra um novo bovino no rebanho. Cria automaticamente a pesagem de entrada e atualiza a ocupação do lote, se informado. Bloqueado quando o limite de cabeças do plano é atingido.' })
  @ApiResponse({ status: 201, description: 'Animal cadastrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 403, description: 'Limite de cabeças do plano atingido.' })
  create(@Body() dto: CreateBovinoDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Put(':id')
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({ summary: 'Atualizar animal', description: 'Atualiza os dados cadastrais do animal. Se o lote for alterado, a ocupação do lote anterior e do novo lote é recalculada automaticamente.' })
  @ApiResponse({ status: 200, description: 'Animal atualizado.' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBovinoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN_FAZENDA', 'ESPECIALISTA')
  @ApiOperation({
    summary: 'Remover animal do rebanho ativo',
    description: 'Soft delete: altera o status do animal (INATIVO, VENDIDO ou MORTO), libera o pasto e invalida o cache. O histórico de pesagens e custos é preservado.',
  })
  @ApiBody({ type: RemoverBovinoDto })
  @ApiResponse({ status: 204, description: 'Animal removido do rebanho ativo.' })
  @ApiResponse({ status: 400, description: 'Motivo inválido.' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado ou já removido.' })
  remover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoverBovinoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.remover(id, dto.motivo, user.tenantId);
  }
}
