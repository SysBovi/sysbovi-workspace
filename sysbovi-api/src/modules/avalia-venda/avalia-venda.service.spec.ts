import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvaliaVendaService } from './avalia-venda.service';
import { Bovino } from '../../database/entities/bovino.entity';
import { ParametroZootecnico } from '../../database/entities/parametro-zootecnico.entity';
import { CustoDiariaHistorico } from '../../database/entities/custo-diaria-historico.entity';
import { MetodoCriacao } from '../../database/entities/lote-pasto.entity';

const mockBovinosRepository = { createQueryBuilder: jest.fn() };
const mockParametrosRepository = { findOne: jest.fn() };
const mockCustoDiariaRepository = { findOne: jest.fn() };

describe('AvaliaVendaService', () => {
  let service: AvaliaVendaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvaliaVendaService,
        { provide: getRepositoryToken(Bovino),               useValue: mockBovinosRepository },
        { provide: getRepositoryToken(ParametroZootecnico),  useValue: mockParametrosRepository },
        { provide: getRepositoryToken(CustoDiariaHistorico), useValue: mockCustoDiariaRepository },
      ],
    }).compile();

    service = module.get<AvaliaVendaService>(AvaliaVendaService);
    jest.clearAllMocks();
  });

  function makeBovino(custoAcumulado: number = 500): Partial<Bovino> {
    return {
      id: 'bov-1',
      brinco: 'BR001',
      raca: 'Nelore',
      dataNascimento: new Date(Date.now() - 20 * 30 * 24 * 60 * 60 * 1000) as any,
      custoAcumuladoNutricao: custoAcumulado as any,
      loteId: 'lote-1',
      lote: { metodoCriacao: MetodoCriacao.LIVRE_PASTO } as any,
    };
  }

  // ── calcularRecomendacao ────────────────────────────────────────────────────

  describe('calcularRecomendacao()', () => {
    it('deve recomendar VENDER_AGORA quando peso acima do mínimo e margem ≥ 25%', async () => {
      // arrobas = (450 × 0.52) / 15 = 15.6; receita = 15.6 × 285 = 4446
      // margem = (4446 - 500) / 4446 ≈ 88.8% — bem acima de 25%
      mockParametrosRepository.findOne.mockResolvedValue({ pesoMinArrobas: 14, pesoMaxArrobas: 18 });
      mockCustoDiariaRepository.findOne.mockResolvedValue({ valorDiaria: '10' });

      const result = await (service as any).calcularRecomendacao(makeBovino(500), 450, 'tenant-1');

      expect(result.recomendacao).toBe('VENDER_AGORA');
      expect(result.arrobasVendaveis).toBeCloseTo(15.6, 1);
      expect(result.margemLucro).toBeGreaterThan(25);
    });

    it('deve recomendar AGUARDAR_ENGORDA quando peso abaixo do mínimo em arrobas', async () => {
      // arrobas = (200 × 0.52) / 15 ≈ 6.93 < pesoMinArrobas=14 → dentroDoPeso=false
      mockParametrosRepository.findOne.mockResolvedValue({ pesoMinArrobas: 14, pesoMaxArrobas: 18 });
      mockCustoDiariaRepository.findOne.mockResolvedValue(null);

      const result = await (service as any).calcularRecomendacao(makeBovino(100), 200, 'tenant-1');

      expect(result.recomendacao).toBe('AGUARDAR_ENGORDA');
    });

    it('deve recomendar AGUARDAR_ENGORDA quando margem de lucro abaixo de 25%', async () => {
      // receita = 4446; custo = 4000; margem = 446/4446 ≈ 10% < 25% → margemOk=false
      mockParametrosRepository.findOne.mockResolvedValue({ pesoMinArrobas: 14, pesoMaxArrobas: 18 });
      mockCustoDiariaRepository.findOne.mockResolvedValue(null);

      const result = await (service as any).calcularRecomendacao(makeBovino(4000), 450, 'tenant-1');

      expect(result.recomendacao).toBe('AGUARDAR_ENGORDA');
      expect(result.margemLucro).toBeLessThan(25);
    });

    it('deve usar fallback de peso corporal ≥ 500kg quando não há parâmetro zootécnico', async () => {
      // sem parâmetro: dentroDoPeso = pesoAtualKg >= 500 → 600 >= 500 = true
      mockParametrosRepository.findOne.mockResolvedValue(null);
      mockCustoDiariaRepository.findOne.mockResolvedValue(null);

      const result = await (service as any).calcularRecomendacao(makeBovino(100), 600, 'tenant-1');

      expect(result.recomendacao).toBe('VENDER_AGORA');
    });

    it('deve retornar os campos calculados corretamente no objeto de resultado', async () => {
      mockParametrosRepository.findOne.mockResolvedValue({ pesoMinArrobas: 14, pesoMaxArrobas: 18 });
      mockCustoDiariaRepository.findOne.mockResolvedValue(null);

      const result = await (service as any).calcularRecomendacao(makeBovino(500), 450, 'tenant-1');

      expect(result).toMatchObject({
        bovinoId: 'bov-1',
        brinco: 'BR001',
        raca: 'Nelore',
        pesoAtualKg: 450,
        custoAcumulado: 500,
      });
      expect(result.receitaEstimada).toBeGreaterThan(0);
      expect(result.lucroEstimado).toBeGreaterThan(0);
    });
  });

  // ── buscarParametro ─────────────────────────────────────────────────────────

  describe('buscarParametro() — seleção de bucket de idade', () => {
    it.each([
      [15, 18],  // abaixo de 18 → bucket 18
      [18, 18],  // exatamente 18 → bucket 18
      [20, 24],  // entre 18 e 24 → bucket 24
      [25, 30],  // entre 24 e 30 → bucket 30
      [36, 36],  // exatamente 36 → bucket 36
      [40, 36],  // acima de 36 → default 36
    ])('idadeMeses=%i deve consultar bucket=%i', async (idadeMeses, expectedBucket) => {
      mockParametrosRepository.findOne.mockResolvedValue(null);

      await (service as any).buscarParametro(MetodoCriacao.LIVRE_PASTO, idadeMeses);

      expect(mockParametrosRepository.findOne).toHaveBeenCalledWith({
        where: { metodoCriacao: MetodoCriacao.LIVRE_PASTO, idadeMeses: expectedBucket },
      });
    });
  });

  // ── calcularDiasParaObjetivo ────────────────────────────────────────────────

  describe('calcularDiasParaObjetivo() — projeção linear com GMD=1.2 kg/dia', () => {
    it('deve calcular o número de dias para atingir o peso alvo', () => {
      // (450 - 300) / 1.2 = 125.0 → Math.ceil(125) = 125
      expect((service as any).calcularDiasParaObjetivo(300, 450)).toBe(125);
    });

    it('deve retornar 0 quando animal já atingiu ou superou o peso alvo', () => {
      expect((service as any).calcularDiasParaObjetivo(500, 450)).toBe(0);
    });

    it('deve arredondar para cima quando resultado é fracionado', () => {
      // (320 - 300) / 1.2 = 16.67 → Math.ceil(16.67) = 17
      expect((service as any).calcularDiasParaObjetivo(300, 320)).toBe(17);
    });

    it('deve retornar 0 quando animal está exatamente no peso alvo', () => {
      expect((service as any).calcularDiasParaObjetivo(450, 450)).toBe(0);
    });
  });
});
