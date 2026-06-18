import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PesagensService } from './pesagens.service';
import { Pesagem } from '../../database/entities/pesagem.entity';
import { RedisService } from '../../redis/redis.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPesagensRepository = {
  find:     jest.fn(),
  findOne:  jest.fn(),
  create:   jest.fn(),
  save:     jest.fn(),
};

const mockRedisService = {
  del: jest.fn().mockResolvedValue(undefined),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('PesagensService', () => {
  let service: PesagensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PesagensService,
        { provide: getRepositoryToken(Pesagem), useValue: mockPesagensRepository },
        { provide: RedisService,               useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<PesagensService>(PesagensService);
    jest.clearAllMocks();
  });

  // ── findByBovino ────────────────────────────────────────────────────────────

  describe('findByBovino()', () => {
    it('deve retornar pesagens do bovino ordenadas por data decrescente', async () => {
      const pesagens = [
        { id: 'p-2', peso: 450, dataPesagem: new Date('2024-06-01') },
        { id: 'p-1', peso: 380, dataPesagem: new Date('2024-03-01') },
      ];
      mockPesagensRepository.find.mockResolvedValue(pesagens);

      const result = await service.findByBovino('bov-1', 'tenant-1');

      expect(result).toEqual(pesagens);
      expect(mockPesagensRepository.find).toHaveBeenCalledWith({
        where: { bovinoId: 'bov-1', tenantId: 'tenant-1' },
        order: { dataPesagem: 'DESC' },
      });
    });
  });

  // ── registrar ───────────────────────────────────────────────────────────────

  describe('registrar()', () => {
    it('deve registrar pesagem com gmd nulo quando não há pesagem anterior', async () => {
      mockPesagensRepository.findOne.mockResolvedValue(null);
      const novaPesagem = { id: 'p-1', peso: 320, gmdCalculado: null };
      mockPesagensRepository.create.mockReturnValue(novaPesagem);
      mockPesagensRepository.save.mockResolvedValue(novaPesagem);

      const result = await service.registrar({ peso: 320 }, 'bov-1', 'tenant-1');

      expect(result.gmdCalculado).toBeNull();
      expect(mockRedisService.del).toHaveBeenCalledWith('stats:tenant-1');
    });

    it('deve calcular gmd corretamente quando há pesagem anterior com intervalo válido', async () => {
      const dataPesagemAnterior = new Date('2024-01-01');
      const dataNovaPesagem     = new Date('2024-02-01'); // 31 dias depois

      mockPesagensRepository.findOne.mockResolvedValue({
        peso: 300,
        dataPesagem: dataPesagemAnterior,
      });

      let gmdSalvo: number | null = null;
      mockPesagensRepository.create.mockImplementation((data) => {
        gmdSalvo = data.gmdCalculado;
        return data;
      });
      mockPesagensRepository.save.mockImplementation((p) => Promise.resolve(p));

      await service.registrar(
        { peso: 362, dataPesagem: dataNovaPesagem.toISOString() },
        'bov-1',
        'tenant-1',
      );

      // 31 dias, ganho de 62kg → GMD ≈ 2.0
      expect(gmdSalvo).toBeCloseTo(2.0, 1);
    });

    it('deve registrar gmd nulo quando pesagem anterior é do mesmo dia (dias = 0)', async () => {
      const hoje = new Date('2024-06-15');

      mockPesagensRepository.findOne.mockResolvedValue({
        peso: 300,
        dataPesagem: hoje,
      });

      let gmdSalvo: number | null | undefined = undefined;
      mockPesagensRepository.create.mockImplementation((data) => {
        gmdSalvo = data.gmdCalculado;
        return data;
      });
      mockPesagensRepository.save.mockImplementation((p) => Promise.resolve(p));

      await service.registrar(
        { peso: 305, dataPesagem: hoje.toISOString() },
        'bov-1',
        'tenant-1',
      );

      expect(gmdSalvo).toBeNull();
    });

    it('deve usar data atual quando dataPesagem não é informada no DTO', async () => {
      mockPesagensRepository.findOne.mockResolvedValue(null);
      mockPesagensRepository.create.mockImplementation((data) => data);
      mockPesagensRepository.save.mockImplementation((p) => Promise.resolve(p));

      const antes = Date.now();
      await service.registrar({ peso: 400 }, 'bov-1', 'tenant-1');
      const depois = Date.now();

      const createCall = mockPesagensRepository.create.mock.calls[0][0];
      expect(createCall.dataPesagem.getTime()).toBeGreaterThanOrEqual(antes);
      expect(createCall.dataPesagem.getTime()).toBeLessThanOrEqual(depois);
    });

    it('deve invalidar o cache do tenant após registrar pesagem', async () => {
      mockPesagensRepository.findOne.mockResolvedValue(null);
      mockPesagensRepository.create.mockReturnValue({});
      mockPesagensRepository.save.mockResolvedValue({});

      await service.registrar({ peso: 350 }, 'bov-1', 'tenant-99');

      expect(mockRedisService.del).toHaveBeenCalledWith('stats:tenant-99');
    });
  });
});
