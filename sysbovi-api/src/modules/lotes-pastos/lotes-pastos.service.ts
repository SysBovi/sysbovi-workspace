import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LotePasto, StatusOcupacao } from '../../database/entities/lote-pasto.entity';
import { CustoDiariaHistorico } from '../../database/entities/custo-diaria-historico.entity';
import { CreateLotePastoDto } from './dto/create-lote-pasto.dto';
import { RegistrarRodizioDto, UpdateLotePastoDto } from './dto/update-lote-pasto.dto';

@Injectable()
export class LotesPastosService {
  constructor(
    @InjectRepository(LotePasto)
    private lotesRepository: Repository<LotePasto>,
    @InjectRepository(CustoDiariaHistorico)
    private custoDiariaRepository: Repository<CustoDiariaHistorico>,
  ) {}

  async findAll(tenantId: string) {
    const lotes = await this.lotesRepository
      .createQueryBuilder('lote')
      .leftJoin('lote.bovinos', 'bovino', 'bovino.status = :status', { status: 'ATIVO' })
      .addSelect('COUNT(bovino.id)', 'ocupacaoAtual')
      .where('lote.tenantId = :tenantId', { tenantId })
      .groupBy('lote.id')
      .getRawAndEntities();

    return lotes.entities.map((lote, index) => ({
      ...lote,
      ocupacaoAtual: parseInt(lotes.raw[index]?.ocupacaoAtual ?? '0'),
      status: lote.statusOcupacao,
    }));
  }

  async findOne(id: string, tenantId: string) {
    const result = await this.lotesRepository
      .createQueryBuilder('lote')
      .leftJoin('lote.bovinos', 'bovino', 'bovino.status = :status', { status: 'ATIVO' })
      .addSelect('COUNT(bovino.id)', 'ocupacaoAtual')
      .where('lote.id = :id AND lote.tenantId = :tenantId', { id, tenantId })
      .groupBy('lote.id')
      .getRawAndEntities();

    if (!result.entities[0]) throw new NotFoundException('Pasto não encontrado.');

    return {
      ...result.entities[0],
      ocupacaoAtual: parseInt(result.raw[0]?.ocupacaoAtual ?? '0'),
    };
  }

  async create(dto: CreateLotePastoDto, tenantId: string) {
    const lote = this.lotesRepository.create({ ...dto, tenantId });
    return this.lotesRepository.save(lote);
  }

  async update(id: string, dto: UpdateLotePastoDto, tenantId: string) {
    const lote = await this.lotesRepository.findOne({ where: { id, tenantId } });
    if (!lote) throw new NotFoundException('Pasto não encontrado.');
    Object.assign(lote, dto);
    return this.lotesRepository.save(lote);
  }

  async registrarRodizio(id: string, dto: RegistrarRodizioDto, tenantId: string) {
    const lote = await this.lotesRepository.findOne({ where: { id, tenantId } });
    if (!lote) throw new NotFoundException('Pasto não encontrado.');
    lote.ultimoRodizio = dto.dataRodizio ? new Date(dto.dataRodizio) : new Date();
    return this.lotesRepository.save(lote);
  }

  async remove(id: string, tenantId: string) {
    const lote = await this.lotesRepository.findOne({ where: { id, tenantId } });
    if (!lote) throw new NotFoundException('Pasto não encontrado.');
    return this.lotesRepository.remove(lote);
  }

  async getCustoDiario(loteId: string, tenantId: string): Promise<number | null> {
    const registro = await this.custoDiariaRepository.findOne({
      where: { loteId, tenantId },
      order: { dataVigencia: 'DESC' },
    });
    return registro ? Number(registro.valorDiaria) : null;
  }

  async setCustoDiario(loteId: string, valorDiaria: number, tenantId: string): Promise<{ valorDiaria: number }> {
    const lote = await this.lotesRepository.findOne({ where: { id: loteId, tenantId } });
    if (!lote) throw new NotFoundException('Pasto não encontrado.');
    const registro = this.custoDiariaRepository.create({ loteId, tenantId, valorDiaria });
    await this.custoDiariaRepository.save(registro);
    return { valorDiaria };
  }

  async atualizarStatusOcupacao(loteId: string) {
    const result = await this.lotesRepository
      .createQueryBuilder('lote')
      .leftJoin('lote.bovinos', 'bovino', 'bovino.status = :status', { status: 'ATIVO' })
      .addSelect('COUNT(bovino.id)', 'ocupacao')
      .where('lote.id = :loteId', { loteId })
      .groupBy('lote.id')
      .getRawAndEntities();

    if (!result.entities[0]) return;

    const lote = result.entities[0];
    const ocupacao = parseInt(result.raw[0]?.ocupacao ?? '0');
    lote.statusOcupacao = ocupacao >= lote.capacidade ? StatusOcupacao.SUPERLOTADO : StatusOcupacao.NORMAL;
    await this.lotesRepository.save(lote);
  }
}
