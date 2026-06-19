import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Bovino } from '../../database/entities/bovino.entity';
import { Insumo } from '../../database/entities/insumo.entity';
import { LotePasto } from '../../database/entities/lote-pasto.entity';
import { RedisService } from '../../redis/redis.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockQueryBuilder = {
  leftJoin:  jest.fn().mockReturnThis(),
  select:    jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where:     jest.fn().mockReturnThis(),
  andWhere:  jest.fn().mockReturnThis(),
  getCount:  jest.fn(),
  getRawOne: jest.fn(),
};

const mockBovinosRepository = {
  count:              jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockInsumosRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockLotesRepository = {
  count: jest.fn(),
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Bovino),   useValue: mockBovinosRepository },
        { provide: getRepositoryToken(Insumo),   useValue: mockInsumosRepository },
        { provide: getRepositoryToken(LotePasto), useValue: mockLotesRepository },
        { provide: RedisService,                 useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  // ── getStats ────────────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('deve retornar dados do cache quando cache hit', async () => {
      const cached = { totalCabecas: 10, insumosEmAlerta: 1, pastosSuperlotados: 0, pesoMedio: 420, gmd: 0.8 };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getStats('tenant-1');

      expect(result).toEqual(cached);
      expect(mockBovinosRepository.count).not.toHaveBeenCalled();
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('deve computar, armazenar em cache e retornar stats quando cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockBovinosRepository.count.mockResolvedValue(15);
      mockLotesRepository.count.mockResolvedValue(2);
      mockQueryBuilder.getCount.mockResolvedValue(3);
      mockQueryBuilder.getRawOne.mockResolvedValue({ pesoMedio: '480.5', gmdMedio: '0.750' });

      const result = await service.getStats('tenant-1');

      expect(result.totalCabecas).toBe(15);
      expect(result.insumosEmAlerta).toBe(3);
      expect(result.pastosSuperlotados).toBe(2);
      expect(result.pesoMedio).toBeCloseTo(480.5);
      expect(result.gmd).toBeCloseTo(0.75);
      expect(mockRedisService.set).toHaveBeenCalledWith('stats:tenant-1', expect.any(String), 30);
    });

    it('deve retornar pesoMedio 0 e gmd 0 quando não há pesagens registradas', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockBovinosRepository.count.mockResolvedValue(5);
      mockLotesRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.getStats('tenant-2');

      expect(result.pesoMedio).toBe(0);
      expect(result.gmd).toBe(0);
    });

    it('deve retornar pesoMedio 0 e gmd 0 quando getRawOne retorna campos nulos', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockBovinosRepository.count.mockResolvedValue(3);
      mockLotesRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawOne.mockResolvedValue({ pesoMedio: null, gmdMedio: null });

      const result = await service.getStats('tenant-3');

      expect(result.pesoMedio).toBe(0);
      expect(result.gmd).toBe(0);
    });
  });
});
