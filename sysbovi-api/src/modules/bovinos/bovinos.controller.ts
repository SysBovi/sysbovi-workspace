import {
  Body, Controller, Get, Param, ParseUUIDPipe,
  Post, Put, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanoLimiteGuard } from '../../common/guards/plano-limite.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BovinosService } from './bovinos.service';
import { CreateBovinoDto } from './dto/create-bovino.dto';
import { UpdateBovinoDto } from './dto/update-bovino.dto';

@Controller('bovinos')
@UseGuards(JwtAuthGuard)
export class BovinosController {
  constructor(private readonly service: BovinosService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @UseGuards(PlanoLimiteGuard)
  create(@Body() dto: CreateBovinoDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBovinoDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.tenantId);
  }
}
