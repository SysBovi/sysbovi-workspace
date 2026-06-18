import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BovinosService } from './bovinos.service';
import { Bovino, StatusBovino } from '../../database/entities/bovino.entity';
import { LotesPastosService } from '../lotes-pastos/lotes-pastos.service';
import { PesagensService } from '../pesagens/pesagens.service';
import { RedisService } from '../../redis/redis.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockQbChain = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawAndEntities: jest.fn(),
};

const mockBovinosRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQbChain),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockLotesPastosService = {
  atualizarStatusOcupacao: jest.fn().mockResolvedValue(undefined),
};

const mockPesagensService = {
  registrar: jest.fn().mockResolvedValue(undefined),
};

const mockRedisService = {
  del: jest.fn().mockResolvedValue(undefined),
  set: jest.fn(),
  get: jest.fn(),
  exists: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('BovinosService', () => {
  let service: BovinosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BovinosService,
        { provide: getRepositoryToken(Bovino), useValue: mockBovinosRepository },
        { provide: LotesPastosService,          useValue: mockLotesPastosService },
        { provide: PesagensService,             useValue: mockPesagensService },
        { provide: RedisService,               useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<BovinosService>(BovinosService);
    jest.clearAllMocks();
    mockBovinosRepository.createQueryBuilder.mockReturnValue(mockQbChain);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = {
      brinco: 'BR001', raca: 'Nelore', sexo: 'M' as const,
      dataNascimento: '2022-01-01', pesoEntrada: 350, loteId: 'lote-1',
    };
    const savedBovino = { id: 'bov-uuid', ...dto, tenantId: 'tenant-1' };

    beforeEach(() => {
      mockBovinosRepository.create.mockReturnValue(savedBovino);
      mockBovinosRepository.save.mockResolvedValue(savedBovino);
      mockQbChain.getRawAndEntities.mockResolvedValue({
        entities: [{ ...savedBovino, custoAcumuladoNutricao: 0, dataNascimento: new Date('2022-01-01') }],
        raw: [{ pesoAtual: '350', ultimaPesagem: null }],
      });
    });

    it('deve salvar bovino e registrar pesagem inicial', async () => {
      await service.create(dto, 'tenant-1');

      expect(mockBovinosRepository.save).toHaveBeenCalledTimes(1);
      expect(mockPesagensService.registrar).toHaveBeenCalledWith(
        { peso: 350 },
        'bov-uuid',
        'tenant-1',
      );
    });

    it('deve atualizar status de ocupação do lote após criar bovino', async () => {
      await service.create(dto, 'tenant-1');

      expect(mockLotesPastosService.atualizarStatusOcupacao).toHaveBeenCalledWith('lote-1');
    });

    it('não atualiza status de ocupação quando loteId não é fornecido', async () => {
      const dtoSemLote = { ...dto, loteId: undefined };
      await service.create(dtoSemLote, 'tenant-1');

      expect(mockLotesPastosService.atualizarStatusOcupacao).not.toHaveBeenCalled();
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    const bovinoExistente = {
      id: 'bov-1', brinco: 'BR001', tenantId: 'tenant-1',
      loteId: 'lote-A', status: StatusBovino.ATIVO, custoAcumuladoNutricao: 0,
      dataNascimento: new Date('2022-01-01'),
    };

    beforeEach(() => {
      mockQbChain.getRawAndEntities.mockResolvedValue({
        entities: [{ ...bovinoExistente, custoAcumuladoNutricao: 0 }],
        raw: [{}],
      });
    });

    it('deve atualizar status de ocupação do lote novo E do lote antigo ao trocar de lote', async () => {
      mockBovinosRepository.findOne.mockResolvedValue({ ...bovinoExistente });
      mockBovinosRepository.save.mockResolvedValue(bovinoExistente);

      await service.update('bov-1', { loteId: 'lote-B' }, 'tenant-1');

      expect(mockLotesPastosService.atualizarStatusOcupacao).toHaveBeenCalledWith('lote-B');
      expect(mockLotesPastosService.atualizarStatusOcupacao).toHaveBeenCalledWith('lote-A');
      expect(mockLotesPastosService.atualizarStatusOcupacao).toHaveBeenCalledTimes(2);
    });

    it('não atualiza ocupação quando o lote não muda', async () => {
      mockBovinosRepository.findOne.mockResolvedValue({ ...bovinoExistente });
      mockBovinosRepository.save.mockResolvedValue(bovinoExistente);

      await service.update('bov-1', { loteId: 'lote-A' }, 'tenant-1'); // mesmo lote

      expect(mockLotesPastosService.atualizarStatusOcupacao).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando bovino não existe', async () => {
      mockBovinosRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('inexistente', { raca: 'Angus' }, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── remover ──────────────────────────────────────────────────────────────────

  describe('remover()', () => {
    const bovinoAtivo = {
      id: 'bov-1', tenantId: 'tenant-1',
      loteId: 'lote-1', status: StatusBovino.ATIVO,
    };

    it('deve setar status=VENDIDO, loteId=null e salvar', async () => {
      mockBovinosRepository.findOne.mockResolvedValue({ ...bovinoAtivo });
      mockBovinosRepository.save.mockResolvedValue(undefined);

      await service.remover('bov-1', 'VENDIDO' as any, 'tenant-1');

      const saved = mockBovinosRepository.save.mock.calls[0][0];
      expect(saved.status).toBe('VENDIDO');
      expect(saved.loteId).toBeNull();
    });

    it('deve atualizar ocupação do lote anterior após remoção', async () => {
      mockBovinosRepository.findOne.mockResolvedValue({ ...bovinoAtivo });
      mockBovinosRepository.save.mockResolvedValue(undefined);

      await service.remover('bov-1', 'VENDIDO' as any, 'tenant-1');

      expect(mockLotesPastosService.atualizarStatusOcupacao).toHaveBeenCalledWith('lote-1');
    });

    it('deve invalidar cache do Redis após remoção', async () => {
      mockBovinosRepository.findOne.mockResolvedValue({ ...bovinoAtivo });
      mockBovinosRepository.save.mockResolvedValue(undefined);

      await service.remover('bov-1', 'MORTO' as any, 'tenant-1');

      expect(mockRedisService.del).toHaveBeenCalledWith('stats:tenant-1');
    });

    it('não atualiza lote quando bovino não estava em nenhum lote', async () => {
      mockBovinosRepository.findOne.mockResolvedValue({ ...bovinoAtivo, loteId: null });
      mockBovinosRepository.save.mockResolvedValue(undefined);

      await service.remover('bov-1', 'INATIVO' as any, 'tenant-1');

      expect(mockLotesPastosService.atualizarStatusOcupacao).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando bovino não existe ou já foi removido', async () => {
      mockBovinosRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remover('inexistente', 'VENDIDO' as any, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
