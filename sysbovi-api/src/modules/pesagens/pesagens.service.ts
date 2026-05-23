import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { differenceInDays } from '../../common/utils/date.util';
import { Pesagem } from '../../database/entities/pesagem.entity';
import { CreatePesagemDto } from './dto/create-pesagem.dto';

@Injectable()
export class PesagensService {
  constructor(
    @InjectRepository(Pesagem)
    private pesagensRepository: Repository<Pesagem>,
  ) {}

  async findByBovino(bovinoId: string, tenantId: string) {
    return this.pesagensRepository.find({
      where: { bovinoId, tenantId },
      order: { dataPesagem: 'DESC' },
    });
  }

  async registrar(dto: CreatePesagemDto, bovinoId: string, tenantId: string) {
    const dataNova = dto.dataPesagem ? new Date(dto.dataPesagem) : new Date();

    const pesagemAnterior = await this.pesagensRepository.findOne({
      where: { bovinoId, tenantId },
      order: { dataPesagem: 'DESC' },
    });

    let gmdCalculado: number | null = null;
    if (pesagemAnterior) {
      const dias = differenceInDays(dataNova, new Date(pesagemAnterior.dataPesagem));
      if (dias > 0) {
        gmdCalculado = (dto.peso - Number(pesagemAnterior.peso)) / dias;
      }
    }

    const pesagem = this.pesagensRepository.create({
      bovinoId,
      tenantId,
      peso: dto.peso,
      dataPesagem: dataNova,
      gmdCalculado,
    });

    return this.pesagensRepository.save(pesagem);
  }
}
