import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { differenceInMonths } from '../../common/utils/date.util';
import { Bovino } from '../../database/entities/bovino.entity';
import { LotesPastosService } from '../lotes-pastos/lotes-pastos.service';
import { PesagensService } from '../pesagens/pesagens.service';
import { CreateBovinoDto } from './dto/create-bovino.dto';
import { UpdateBovinoDto } from './dto/update-bovino.dto';

@Injectable()
export class BovinosService {
  constructor(
    @InjectRepository(Bovino)
    private bovinosRepository: Repository<Bovino>,
    private lotesPastosService: LotesPastosService,
    private pesagensService: PesagensService,
  ) {}

  private buildListQuery(tenantId: string) {
    return this.bovinosRepository
      .createQueryBuilder('bovino')
      .leftJoinAndSelect('bovino.lote', 'lote')
      .leftJoin(
        (qb) =>
          qb
            .select('p.bovino_id', 'bovinoId')
            .addSelect('p.peso', 'peso')
            .addSelect('p.data_pesagem', 'dataPesagem')
            .from('pesagens', 'p')
            .where(
              'p.id = (SELECT id FROM pesagens WHERE bovino_id = p.bovino_id ORDER BY data_pesagem DESC LIMIT 1)',
            ),
        'ultima_pesagem',
        'ultima_pesagem."bovinoId" = bovino.id',
      )
      .addSelect('ultima_pesagem.peso', 'pesoAtual')
      .addSelect('ultima_pesagem."dataPesagem"', 'ultimaPesagem')
      .where('bovino.tenantId = :tenantId', { tenantId });
  }

  async findAll(tenantId: string) {
    const { entities, raw } = await this.buildListQuery(tenantId)
      .orderBy('bovino.brinco', 'ASC')
      .getRawAndEntities();

    return entities.map((bovino, i) => this.mapBovinoResponse(bovino, raw[i]));
  }

  async findOne(id: string, tenantId: string) {
    const { entities, raw } = await this.buildListQuery(tenantId)
      .andWhere('bovino.id = :id', { id })
      .getRawAndEntities();

    if (!entities[0]) throw new NotFoundException('Animal não encontrado.');
    return this.mapBovinoResponse(entities[0], raw[0]);
  }

  async create(dto: CreateBovinoDto, tenantId: string) {
    const bovino = this.bovinosRepository.create({
      ...dto,
      tenantId,
      dataNascimento: new Date(dto.dataNascimento),
      dataEntrada: dto.dataEntrada ? new Date(dto.dataEntrada) : new Date(),
    });

    const savedBovino = await this.bovinosRepository.save(bovino);

    await this.pesagensService.registrar(
      { peso: dto.pesoEntrada },
      savedBovino.id,
      tenantId,
    );

    if (dto.loteId) {
      await this.lotesPastosService.atualizarStatusOcupacao(dto.loteId);
    }

    return this.findOne(savedBovino.id, tenantId);
  }

  async update(id: string, dto: UpdateBovinoDto, tenantId: string) {
    const bovino = await this.bovinosRepository.findOne({ where: { id, tenantId } });
    if (!bovino) throw new NotFoundException('Animal não encontrado.');

    const loteAnterior = bovino.loteId;
    Object.assign(bovino, dto);
    await this.bovinosRepository.save(bovino);

    if (dto.loteId !== undefined && dto.loteId !== loteAnterior) {
      if (dto.loteId) await this.lotesPastosService.atualizarStatusOcupacao(dto.loteId);
      if (loteAnterior) await this.lotesPastosService.atualizarStatusOcupacao(loteAnterior);
    }

    return this.findOne(id, tenantId);
  }

  private mapBovinoResponse(bovino: Bovino, raw: any) {
    const idadeMeses = differenceInMonths(new Date(), new Date(bovino.dataNascimento));
    return {
      ...bovino,
      pesoAtual: raw?.pesoAtual ? parseFloat(raw.pesoAtual) : bovino.pesoEntrada ?? 0,
      ultimaPesagem: raw?.ultimaPesagem ?? null,
      idadeMeses,
      custoAcumulado: parseFloat(bovino.custoAcumuladoNutricao as any),
    };
  }
}
