import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { differenceInMonths } from '../../common/utils/date.util';
import { Bovino } from '../../database/entities/bovino.entity';
import { MetodoCriacao } from '../../database/entities/lote-pasto.entity';
import { ParametroZootecnico } from '../../database/entities/parametro-zootecnico.entity';
import { CustoDiariaHistorico } from '../../database/entities/custo-diaria-historico.entity';

const RENDIMENTO_CARCACA = 0.52;
const KG_POR_ARROBA = 15;
const MARGEM_MINIMA_RECOMENDACAO = 0.25;
const PRECO_ARROBA_PADRAO = 285;

@Injectable()
export class AvaliaVendaService {
  constructor(
    @InjectRepository(Bovino)
    private bovinosRepository: Repository<Bovino>,
    @InjectRepository(ParametroZootecnico)
    private parametrosRepository: Repository<ParametroZootecnico>,
    @InjectRepository(CustoDiariaHistorico)
    private custoDiariaRepository: Repository<CustoDiariaHistorico>,
  ) {}

  async avaliar(tenantId: string) {
    const bovinos = await this.bovinosRepository
      .createQueryBuilder('bovino')
      .leftJoinAndSelect('bovino.lote', 'lote')
      .leftJoin(
        (qb) =>
          qb
            .select('p.bovino_id', 'bovinoId')
            .addSelect('p.peso', 'peso')
            .from('pesagens', 'p')
            .where(
              'p.id = (SELECT id FROM pesagens WHERE bovino_id = p.bovino_id ORDER BY data_pesagem DESC LIMIT 1)',
            ),
        'ultima',
        'ultima."bovinoId" = bovino.id',
      )
      .addSelect('ultima.peso', 'pesoAtual')
      .where('bovino.tenantId = :tenantId AND bovino.status = :status', {
        tenantId,
        status: 'ATIVO',
      })
      .getRawAndEntities();

    const resultados = await Promise.all(
      bovinos.entities.map((bovino, i) =>
        this.calcularRecomendacao(bovino, parseFloat(bovinos.raw[i]?.pesoAtual ?? '0'), tenantId),
      ),
    );

    return resultados;
  }

  private async calcularRecomendacao(bovino: Bovino, pesoAtualKg: number, tenantId: string) {
    const idadeMeses = differenceInMonths(new Date(), new Date(bovino.dataNascimento));
    const metodoCriacao = bovino.lote?.metodoCriacao ?? MetodoCriacao.LIVRE_PASTO;

    const arrobasVendaveis = (pesoAtualKg * RENDIMENTO_CARCACA) / KG_POR_ARROBA;
    const custoAcumulado = Number(bovino.custoAcumuladoNutricao);

    const parametro = await this.buscarParametro(metodoCriacao, idadeMeses);

    const custoDiaria = await this.buscarCustoDiaria(bovino.loteId, tenantId);
    const diasParaPesoIdeal = parametro
      ? this.calcularDiasParaObjetivo(pesoAtualKg, parametro.pesoMaxArrobas * KG_POR_ARROBA)
      : null;

    const receitaEstimada = arrobasVendaveis * PRECO_ARROBA_PADRAO;
    const custoFuturoProjetado =
      diasParaPesoIdeal && custoDiaria ? diasParaPesoIdeal * custoDiaria : 0;
    const lucroEstimado = receitaEstimada - custoAcumulado;
    const margem = receitaEstimada > 0 ? lucroEstimado / receitaEstimada : 0;

    const dentroDoPeso = parametro
      ? arrobasVendaveis >= parametro.pesoMinArrobas
      : pesoAtualKg >= 500;
    const margemOk = margem >= MARGEM_MINIMA_RECOMENDACAO;

    return {
      bovinoId: bovino.id,
      brinco: bovino.brinco,
      raca: bovino.raca,
      idadeMeses,
      pesoAtualKg,
      arrobasVendaveis: parseFloat(arrobasVendaveis.toFixed(2)),
      custoAcumulado,
      receitaEstimada: parseFloat(receitaEstimada.toFixed(2)),
      lucroEstimado: parseFloat(lucroEstimado.toFixed(2)),
      margemLucro: parseFloat((margem * 100).toFixed(1)),
      diasParaObjetivo: diasParaPesoIdeal,
      custoFuturoProjetado: parseFloat(custoFuturoProjetado.toFixed(2)),
      recomendacao: dentroDoPeso && margemOk ? 'VENDER_AGORA' : 'AGUARDAR_ENGORDA',
    };
  }

  private async buscarParametro(metodoCriacao: MetodoCriacao, idadeMeses: number) {
    const faixas = [18, 24, 30, 36];
    const faixaMaisProxima = faixas.find((f) => idadeMeses <= f) ?? 36;

    return this.parametrosRepository.findOne({
      where: { metodoCriacao, idadeMeses: faixaMaisProxima },
    });
  }

  private async buscarCustoDiaria(loteId: string | null, tenantId: string) {
    if (!loteId) return null;
    const registro = await this.custoDiariaRepository.findOne({
      where: { loteId, tenantId },
      order: { dataVigencia: 'DESC' },
    });
    return registro ? Number(registro.valorDiaria) : null;
  }

  private calcularDiasParaObjetivo(pesoAtual: number, pesoAlvo: number): number | null {
    const GMD_ESTIMADO = 1.2;
    if (pesoAtual >= pesoAlvo) return 0;
    return Math.ceil((pesoAlvo - pesoAtual) / GMD_ESTIMADO);
  }
}
