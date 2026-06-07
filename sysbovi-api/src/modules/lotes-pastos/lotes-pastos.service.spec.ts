import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { LotesPastosService } from './lotes-pastos.service';
import { LotePasto, StatusOcupacao } from '../../database/entities/lote-pasto.entity';
import { CustoDiariaHistorico } from '../../database/entities/custo-diaria-historico.entity';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockQbChain = {
  leftJoin: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawAndEntities: jest.fn(),
};

const mockLotesRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQbChain),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockCustoDiariaRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('LotesPastosService', () => {
  let service: LotesPastosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotesPastosService,
        { provide: getRepositoryToken(LotePasto),            useValue: mockLotesRepository },
        { provide: getRepositoryToken(CustoDiariaHistorico), useValue: mockCustoDiariaRepository },
      ],
    }).compile();

    service = module.get<LotesPastosService>(LotesPastosService);
    jest.clearAllMocks();
    mockLotesRepository.createQueryBuilder.mockReturnValue(mockQbChain);
  });

  // ── atualizarStatusOcupacao ─────────────────────────────────────────────────

  describe('atualizarStatusOcupacao()', () => {
    function setupQb(lote: Partial<LotePasto> | null, ocupacao: number) {
      mockQbChain.getRawAndEntities.mockResolvedValue({
        entities: lote ? [lote] : [],
        raw: lote ? [{ ocupacao: String(ocupacao) }] : [],
      });
    }

    it('deve setar SUPERLOTADO quando ocupação ≥ capacidade', async () => {
      const lote = { id: 'lote-1', capacidade: 5, statusOcupacao: StatusOcupacao.NORMAL };
      setupQb(lote, 5); // 5 >= 5
      mockLotesRepository.save.mockResolvedValue(undefined);

      await service.atualizarStatusOcupacao('lote-1');

      const saved = mockLotesRepository.save.mock.calls[0][0] as LotePasto;
      expect(saved.statusOcupacao).toBe(StatusOcupacao.SUPERLOTADO);
    });

    it('deve setar NORMAL quando ocupação < capacidade', async () => {
      const lote = { id: 'lote-1', capacidade: 10, statusOcupacao: StatusOcupacao.SUPERLOTADO };
      setupQb(lote, 3); // 3 < 10
      mockLotesRepository.save.mockResolvedValue(undefined);

      await service.atualizarStatusOcupacao('lote-1');

      const saved = mockLotesRepository.save.mock.calls[0][0] as LotePasto;
      expect(saved.statusOcupacao).toBe(StatusOcupacao.NORMAL);
    });

    it('deve setar NORMAL quando lote está vazio (0 bovinos)', async () => {
      const lote = { id: 'lote-1', capacidade: 10, statusOcupacao: StatusOcupacao.NORMAL };
      setupQb(lote, 0);
      mockLotesRepository.save.mockResolvedValue(undefined);

      await service.atualizarStatusOcupacao('lote-1');

      const saved = mockLotesRepository.save.mock.calls[0][0] as LotePasto;
      expect(saved.statusOcupacao).toBe(StatusOcupacao.NORMAL);
    });

    it('deve retornar sem salvar quando lote não é encontrado', async () => {
      setupQb(null, 0);

      await service.atualizarStatusOcupacao('lote-inexistente');

      expect(mockLotesRepository.save).not.toHaveBeenCalled();
    });

    it('deve setar SUPERLOTADO quando ocupação está exatamente na capacidade', async () => {
      const lote = { id: 'lote-1', capacidade: 1, statusOcupacao: StatusOcupacao.NORMAL };
      setupQb(lote, 1); // 1 >= 1
      mockLotesRepository.save.mockResolvedValue(undefined);

      await service.atualizarStatusOcupacao('lote-1');

      const saved = mockLotesRepository.save.mock.calls[0][0] as LotePasto;
      expect(saved.statusOcupacao).toBe(StatusOcupacao.SUPERLOTADO);
    });
  });

  // ── setCustoDiario ──────────────────────────────────────────────────────────

  describe('setCustoDiario()', () => {
    it('deve criar registro de custo diário e retornar o valor', async () => {
      mockLotesRepository.findOne.mockResolvedValue({ id: 'lote-1' });
      mockCustoDiariaRepository.create.mockReturnValue({ loteId: 'lote-1', valorDiaria: 15 });
      mockCustoDiariaRepository.save.mockResolvedValue(undefined);

      const result = await service.setCustoDiario('lote-1', 15, 'tenant-1');

      expect(mockCustoDiariaRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ valorDiaria: 15 });
    });

    it('deve lançar NotFoundException quando lote não existe', async () => {
      mockLotesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setCustoDiario('inexistente', 15, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getCustoDiario ──────────────────────────────────────────────────────────

  describe('getCustoDiario()', () => {
    it('deve retornar o valor da diária mais recente', async () => {
      mockCustoDiariaRepository.findOne.mockResolvedValue({ valorDiaria: '25.50' });

      const result = await service.getCustoDiario('lote-1', 'tenant-1');

      expect(result).toBe(25.5);
    });

    it('deve retornar null quando não há registro de custo', async () => {
      mockCustoDiariaRepository.findOne.mockResolvedValue(null);

      const result = await service.getCustoDiario('lote-1', 'tenant-1');

      expect(result).toBeNull();
    });
  });
});
