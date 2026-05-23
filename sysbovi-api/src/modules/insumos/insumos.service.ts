import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Insumo, StatusInsumo } from '../../database/entities/insumo.entity';
import { UsoInsumo } from '../../database/entities/uso-insumo.entity';
import { Bovino } from '../../database/entities/bovino.entity';
import { LotePasto } from '../../database/entities/lote-pasto.entity';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { AdicionarEstoqueDto, UsarInsumoDto } from './dto/usar-insumo.dto';

const FATOR_PERDA: Record<string, number> = {
  LIVRE_PASTO: 1.05,
  SEMI_CONFINADO: 1.03,
  CONFINADO: 1.00,
};

@Injectable()
export class InsumosService {
  constructor(
    @InjectRepository(Insumo)
    private insumosRepository: Repository<Insumo>,
    private dataSource: DataSource,
  ) {}

  private calcularStatus(quantidadeAtual: number, nivelMinimo: number): StatusInsumo {
    if (nivelMinimo === 0) return 'NORMAL';
    const percentual = quantidadeAtual / nivelMinimo;
    if (percentual < 0.5) return 'CRITICO';
    if (percentual < 0.9) return 'BAIXO';
    return 'NORMAL';
  }

  private toResponse(insumo: Insumo) {
    return {
      ...insumo,
      status: this.calcularStatus(Number(insumo.quantidadeAtual), Number(insumo.nivelMinimo)),
    };
  }

  async findAll(tenantId: string) {
    const insumos = await this.insumosRepository.find({
      where: { tenantId },
      order: { nome: 'ASC' },
    });
    return insumos.map(this.toResponse.bind(this));
  }

  async findOne(id: string, tenantId: string) {
    const insumo = await this.insumosRepository.findOne({ where: { id, tenantId } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado.');
    return this.toResponse(insumo);
  }

  async create(dto: CreateInsumoDto, tenantId: string) {
    const insumo = this.insumosRepository.create({
      ...dto,
      tenantId,
      validade: dto.validade ? new Date(dto.validade) : null,
    });
    const saved = await this.insumosRepository.save(insumo);
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateInsumoDto, tenantId: string) {
    const insumo = await this.insumosRepository.findOne({ where: { id, tenantId } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado.');
    Object.assign(insumo, {
      ...dto,
      validade: dto.validade !== undefined ? (dto.validade ? new Date(dto.validade) : null) : insumo.validade,
    });
    const saved = await this.insumosRepository.save(insumo);
    return this.toResponse(saved);
  }

  async remove(id: string, tenantId: string) {
    const insumo = await this.insumosRepository.findOne({ where: { id, tenantId } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado.');
    await this.insumosRepository.remove(insumo);
  }

  async getHistorico(id: string, tenantId: string) {
    const insumo = await this.insumosRepository.findOne({ where: { id, tenantId } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado.');

    const registros = await this.dataSource
      .getRepository(UsoInsumo)
      .createQueryBuilder('uso')
      .leftJoinAndSelect('uso.lote', 'lote')
      .where('uso.insumoId = :id AND uso.tenantId = :tenantId', { id, tenantId })
      .orderBy('uso.dataUso', 'DESC')
      .limit(50)
      .getMany();

    return registros.map((r) => ({
      id: r.id,
      dataUso: r.dataUso,
      loteNome: r.lote?.nome ?? '—',
      quantidadeUtilizada: Number(r.quantidadeUtilizada),
      valorUnitario: Number(r.valorUnitario),
      custoTotal: Number(r.custoTotal),
    }));
  }

  async adicionarEstoque(id: string, dto: AdicionarEstoqueDto, tenantId: string) {
    const insumo = await this.insumosRepository.findOne({ where: { id, tenantId } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado.');
    insumo.quantidadeAtual = Number(insumo.quantidadeAtual) + dto.quantidade;
    const saved = await this.insumosRepository.save(insumo);
    return this.toResponse(saved);
  }

  async usarInsumo(id: string, dto: UsarInsumoDto, tenantId: string) {
    await this.dataSource.transaction(async (manager) => {
      const insumo = await manager.findOne(Insumo, { where: { id, tenantId } });
      if (!insumo) throw new NotFoundException('Insumo não encontrado.');

      if (Number(insumo.quantidadeAtual) < dto.quantidadeUtilizada) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${insumo.quantidadeAtual} ${insumo.unidade}.`,
        );
      }

      insumo.quantidadeAtual = Number(insumo.quantidadeAtual) - dto.quantidadeUtilizada;
      await manager.save(Insumo, insumo);

      const lote = await manager.findOne(LotePasto, { where: { id: dto.loteId, tenantId } });
      if (!lote) throw new NotFoundException('Lote/Pasto não encontrado.');

      const fator = FATOR_PERDA[lote.metodoCriacao] ?? 1.0;
      const custoTotal = dto.quantidadeUtilizada * Number(insumo.custoUnitario);

      const bovinos = await manager.find(Bovino, {
        where: { loteId: dto.loteId, tenantId, status: 'ATIVO' },
      });

      if (bovinos.length > 0) {
        const custoRateadoPorCabeca = (custoTotal * fator) / bovinos.length;
        for (const bovino of bovinos) {
          bovino.custoAcumuladoNutricao =
            Number(bovino.custoAcumuladoNutricao) + custoRateadoPorCabeca;
        }
        await manager.save(Bovino, bovinos);
      }

      const uso = manager.create(UsoInsumo, {
        tenantId,
        insumoId: id,
        loteId: dto.loteId,
        quantidadeUtilizada: dto.quantidadeUtilizada,
        valorUnitario: Number(insumo.custoUnitario),
        custoTotal,
      });
      await manager.save(UsoInsumo, uso);
    });

    return this.findOne(id, tenantId);
  }
}
