import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { Insumo } from '../../database/entities/insumo.entity';
import { LotePasto, MetodoCriacao } from '../../database/entities/lote-pasto.entity';
import { Bovino, StatusBovino } from '../../database/entities/bovino.entity';
import { UsoInsumo } from '../../database/entities/uso-insumo.entity';

// ─── Mock do transaction manager ──────────────────────────────────────────────

function buildMockManager(overrides: {
  insumo?: Partial<Insumo> | null;
  lote?: Partial<LotePasto> | null;
  bovinos?: Partial<Bovino>[];
} = {}) {
  const { insumo, lote, bovinos = [] } = overrides;

  return {
    findOne: jest.fn()
      .mockResolvedValueOnce(insumo ?? null)
      .mockResolvedValueOnce(lote ?? null),
    save: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue(bovinos),
    create: jest.fn().mockImplementation((_entity, data) => ({ ...data })),
  };
}

const mockInsumosRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

let capturedTransactionCallback: ((manager: any) => Promise<any>) | null = null;

const mockDataSource = {
  transaction: jest.fn().mockImplementation((callback: (manager: any) => Promise<any>) => {
    capturedTransactionCallback = callback;
    return Promise.resolve();
  }),
  getRepository: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('InsumosService', () => {
  let service: InsumosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsumosService,
        { provide: getRepositoryToken(Insumo), useValue: mockInsumosRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<InsumosService>(InsumosService);
    jest.clearAllMocks();
    capturedTransactionCallback = null;
  });

  // ── calcularStatus ──────────────────────────────────────────────────────────

  describe('calcularStatus() — thresholds de estoque', () => {
    it.each([
      [0,   100, 'CRITICO'],  // 0%   < 50%
      [40,  100, 'CRITICO'],  // 40%  < 50%
      [50,  100, 'BAIXO'],    // 50%  >= 50% e < 90%
      [80,  100, 'BAIXO'],    // 80%  < 90%
      [90,  100, 'NORMAL'],   // 90%  >= 90%
      [120, 100, 'NORMAL'],   // 120% — acima do mínimo
      [0,   0,   'NORMAL'],   // nivelMinimo=0 → caso especial → NORMAL
    ])('qty=%i, min=%i → %s', (qty, min, expected) => {
      expect((service as any).calcularStatus(qty, min)).toBe(expected);
    });
  });

  // ── usarInsumo ──────────────────────────────────────────────────────────────

  describe('usarInsumo()', () => {
    function makeInsumo(quantidadeAtual: number): Partial<Insumo> {
      return {
        id: 'insumo-1',
        nome: 'Ração Premium',
        quantidadeAtual: quantidadeAtual as any,
        custoUnitario: 20 as any,
        nivelMinimo: 10 as any,
        unidade: 'kg',
        tenantId: 'tenant-1',
      };
    }

    function makeLote(metodoCriacao: MetodoCriacao): Partial<LotePasto> {
      return { id: 'lote-1', metodoCriacao, tenantId: 'tenant-1' };
    }

    const dto = { loteId: 'lote-1', quantidadeUtilizada: 10 };

    it('deve debitar estoque e distribuir custo com fator LIVRE_PASTO=1.05', async () => {
      // custoTotal = 10 × 20 = 200; fator = 1.05; 2 bovinos → 200×1.05/2 = 105 por cabeça
      const bovinos = [
        { id: 'bov-1', custoAcumuladoNutricao: 500 },
        { id: 'bov-2', custoAcumuladoNutricao: 300 },
      ];
      const mockManager = buildMockManager({
        insumo: makeInsumo(100),
        lote: makeLote(MetodoCriacao.LIVRE_PASTO),
        bovinos,
      });

      // findOne final (após transação): retorna insumo atualizado
      mockInsumosRepository.findOne.mockResolvedValue({
        ...makeInsumo(90),
        nivelMinimo: 10,
      });

      mockDataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      await service.usarInsumo('insumo-1', dto, 'tenant-1');

      const savedBovinos = mockManager.save.mock.calls.find(
        (call: any) => call[0] === Bovino,
      );
      expect(savedBovinos).toBeDefined();
      const bovinosAtualizados = savedBovinos![1] as any[];
      expect(bovinosAtualizados[0].custoAcumuladoNutricao).toBeCloseTo(605, 0); // 500 + 105
      expect(bovinosAtualizados[1].custoAcumuladoNutricao).toBeCloseTo(405, 0); // 300 + 105
    });

    it('deve aplicar fator CONFINADO=1.00 sem acréscimo de perda', async () => {
      // custoTotal = 10 × 20 = 200; fator = 1.00; 2 bovinos → 200×1.00/2 = 100 por cabeça
      const bovinos = [
        { id: 'bov-1', custoAcumuladoNutricao: 0 },
        { id: 'bov-2', custoAcumuladoNutricao: 0 },
      ];
      const mockManager = buildMockManager({
        insumo: makeInsumo(100),
        lote: makeLote(MetodoCriacao.CONFINADO),
        bovinos,
      });

      mockInsumosRepository.findOne.mockResolvedValue(makeInsumo(90));
      mockDataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      await service.usarInsumo('insumo-1', dto, 'tenant-1');

      const savedBovinos = mockManager.save.mock.calls.find(
        (call: any) => call[0] === Bovino,
      )![1] as any[];
      expect(savedBovinos[0].custoAcumuladoNutricao).toBeCloseTo(100, 0);
    });

    it('deve lançar BadRequestException quando estoque é insuficiente', async () => {
      const mockManager = buildMockManager({ insumo: makeInsumo(5) }); // tem 5, precisa de 10
      mockDataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      await expect(
        service.usarInsumo('insumo-1', dto, 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException quando insumo não existe', async () => {
      const mockManager = buildMockManager({ insumo: null });
      mockDataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      await expect(
        service.usarInsumo('insumo-inexistente', dto, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('não deve atualizar bovinos quando lote está vazio', async () => {
      const mockManager = buildMockManager({
        insumo: makeInsumo(100),
        lote: makeLote(MetodoCriacao.LIVRE_PASTO),
        bovinos: [],
      });

      mockInsumosRepository.findOne.mockResolvedValue(makeInsumo(90));
      mockDataSource.transaction.mockImplementation((cb: any) => cb(mockManager));

      await service.usarInsumo('insumo-1', dto, 'tenant-1');

      const savedBovinos = mockManager.save.mock.calls.find(
        (call: any) => call[0] === Bovino,
      );
      expect(savedBovinos).toBeUndefined();
    });
  });
});
