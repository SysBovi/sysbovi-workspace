import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PesagensService } from './pesagens.service';
import { CreatePesagemDto } from './dto/create-pesagem.dto';

@Controller('bovinos/:bovinoId/pesagens')
@UseGuards(JwtAuthGuard)
export class PesagensController {
  constructor(private readonly service: PesagensService) {}

  @Get()
  findAll(
    @Param('bovinoId', ParseUUIDPipe) bovinoId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.findByBovino(bovinoId, user.tenantId);
  }

  @Post()
  registrar(
    @Param('bovinoId', ParseUUIDPipe) bovinoId: string,
    @Body() dto: CreatePesagemDto,
    @CurrentUser() user: any,
  ) {
    return this.service.registrar(dto, bovinoId, user.tenantId);
  }
}
