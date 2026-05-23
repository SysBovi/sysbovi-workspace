import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LotesPastosService } from './lotes-pastos.service';
import { CreateLotePastoDto } from './dto/create-lote-pasto.dto';
import { RegistrarRodizioDto, UpdateLotePastoDto } from './dto/update-lote-pasto.dto';

@Controller('pastos')
@UseGuards(JwtAuthGuard)
export class LotesPastosController {
  constructor(private readonly service: LotesPastosService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateLotePastoDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLotePastoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }

  @Patch(':id/rodizio')
  registrarRodizio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarRodizioDto,
    @CurrentUser() user: any,
  ) {
    return this.service.registrarRodizio(id, dto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }
}
