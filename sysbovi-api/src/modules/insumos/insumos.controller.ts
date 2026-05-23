import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { AdicionarEstoqueDto, UsarInsumoDto } from './dto/usar-insumo.dto';

@Controller('insumos')
@UseGuards(JwtAuthGuard)
export class InsumosController {
  constructor(private readonly service: InsumosService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateInsumoDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsumoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }

  @Get(':id/historico')
  getHistorico(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.getHistorico(id, user.tenantId);
  }

  @Patch(':id/adicionar')
  adicionarEstoque(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdicionarEstoqueDto,
    @CurrentUser() user: any,
  ) {
    return this.service.adicionarEstoque(id, dto, user.tenantId);
  }

  @Post(':id/usar')
  usarInsumo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UsarInsumoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.usarInsumo(id, dto, user.tenantId);
  }
}
