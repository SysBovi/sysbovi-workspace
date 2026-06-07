import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bovino, StatusBovino } from '../../database/entities/bovino.entity';
import { Insumo } from '../../database/entities/insumo.entity';
import { LotePasto, StatusOcupacao } from '../../database/entities/lote-pasto.entity';
import { RedisService } from '../../redis/redis.service';

const STATS_CACHE_TTL = 30;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Bovino)
    private bovinosRepository: Repository<Bovino>,
    @InjectRepository(Insumo)
    private insumosRepository: Repository<Insumo>,
    @InjectRepository(LotePasto)
    private lotesRepository: Repository<LotePasto>,
    private redisService: RedisService,
  ) {}

  async getStats(tenantId: string) {
    const cacheKey = `stats:${tenantId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.computeStats(tenantId);
    await this.redisService.set(cacheKey, JSON.stringify(result), STATS_CACHE_TTL);
    return result;
  }

  private async computeStats(tenantId: string) {
    const [totalCabecas, insumosEmAlerta, pastosSuperlotados, mediaPesoGmd] = await Promise.all([
      this.bovinosRepository.count({ where: { tenantId, status: StatusBovino.ATIVO } }),

      this.insumosRepository
        .createQueryBuilder('insumo')
        .where('insumo.tenantId = :tenantId', { tenantId })
        .andWhere('insumo.nivelMinimo > 0')
        .andWhere('insumo.quantidadeAtual < insumo.nivelMinimo')
        .getCount(),

      this.lotesRepository.count({ where: { tenantId, statusOcupacao: StatusOcupacao.SUPERLOTADO } }),

      this.bovinosRepository
        .createQueryBuilder('bovino')
        .leftJoin(
          (qb) =>
            qb
              .select('p.bovino_id', 'bovinoId')
              .addSelect('p.peso', 'peso')
              .addSelect('p.gmd_calculado', 'gmd')
              .from('pesagens', 'p')
              .where(
                'p.id = (SELECT id FROM pesagens WHERE bovino_id = p.bovino_id ORDER BY data_pesagem DESC LIMIT 1)',
              ),
          'ultima',
          'ultima."bovinoId" = bovino.id',
        )
        .select('AVG(ultima.peso)', 'pesoMedio')
        .addSelect('AVG(ultima.gmd)', 'gmdMedio')
        .where('bovino.tenantId = :tenantId AND bovino.status = :status', {
          tenantId,
          status: 'ATIVO',
        })
        .getRawOne(),
    ]);

    return {
      totalCabecas,
      insumosEmAlerta,
      pastosSuperlotados,
      pesoMedio: mediaPesoGmd?.pesoMedio ? parseFloat(mediaPesoGmd.pesoMedio) : 0,
      gmd: mediaPesoGmd?.gmdMedio ? parseFloat(mediaPesoGmd.gmdMedio) : 0,
    };
  }
}
