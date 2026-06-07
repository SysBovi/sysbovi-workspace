import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BackofficeService } from './backoffice.service';
import { Tenant, StatusConta } from '../../database/entities/tenant.entity';
import { FaturaSaas, StatusPagamento } from '../../database/entities/fatura-saas.entity';
import { LogAuditoria } from '../../database/entities/log-auditoria.entity';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockTenantsRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  update: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn(),
};

const mockFaturasRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockLogsRepository = {
  find: jest.fn(),
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn().mockResolvedValue(undefined),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('BackofficeService', () => {
  let service: BackofficeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackofficeService,
        { provide: getRepositoryToken(Tenant),       useValue: mockTenantsRepository },
        { provide: getRepositoryToken(FaturaSaas),   useValue: mockFaturasRepository },
        { provide: getRepositoryToken(LogAuditoria), useValue: mockLogsRepository },
      ],
    }).compile();

    service = module.get<BackofficeService>(BackofficeService);
    jest.clearAllMocks();
  });

  // ── atualizarFatura ─────────────────────────────────────────────────────────

  describe('atualizarFatura()', () => {
    function makeFatura(
      statusPagamento: StatusPagamento,
      dataVencimento: Date,
    ): FaturaSaas {
      return {
        id: 'fatura-1',
        tenantId: 'tenant-1',
        valor: 99.9,
        dataVencimento,
        dataPagamento: null,
        statusPagamento,
      } as FaturaSaas;
    }

    it('deve atualizar status para PAGO sem alterar tenant quando era PENDENTE', async () => {
      mockFaturasRepository.findOne.mockResolvedValue(
        makeFatura(StatusPagamento.PENDENTE, new Date('2025-01-01')),
      );
      mockFaturasRepository.save.mockImplementation((f) => Promise.resolve(f));

      await service.atualizarFatura('fatura-1', { statusPagamento: StatusPagamento.PAGO });

      expect(mockTenantsRepository.update).not.toHaveBeenCalled();
    });

    it('deve bloquear tenant (INADIMPLENTE) quando fatura vence ATRASADA com data no passado', async () => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      mockFaturasRepository.findOne.mockResolvedValue(
        makeFatura(StatusPagamento.PENDENTE, ontem),
      );
      mockFaturasRepository.save.mockImplementation((f) => Promise.resolve(f));

      await service.atualizarFatura('fatura-1', { statusPagamento: StatusPagamento.ATRASADO });

      expect(mockTenantsRepository.update).toHaveBeenCalledWith(
        'tenant-1',
        { statusConta: StatusConta.INADIMPLENTE },
      );
      expect(mockLogsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'BLOQUEIO_AUTOMATICO' }),
      );
    });

    it('não deve bloquear tenant quando dataVencimento ainda não passou (ATRASADO mas futuro)', async () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      mockFaturasRepository.findOne.mockResolvedValue(
        makeFatura(StatusPagamento.PENDENTE, amanha),
      );
      mockFaturasRepository.save.mockImplementation((f) => Promise.resolve(f));

      await service.atualizarFatura('fatura-1', { statusPagamento: StatusPagamento.ATRASADO });

      expect(mockTenantsRepository.update).not.toHaveBeenCalled();
    });

    it('deve reativar tenant (ATIVA) quando fatura ATRASADA é paga', async () => {
      mockFaturasRepository.findOne.mockResolvedValue(
        makeFatura(StatusPagamento.ATRASADO, new Date('2025-01-01')),
      );
      mockFaturasRepository.save.mockImplementation((f) => Promise.resolve(f));

      await service.atualizarFatura('fatura-1', { statusPagamento: StatusPagamento.PAGO });

      expect(mockTenantsRepository.update).toHaveBeenCalledWith(
        'tenant-1',
        { statusConta: StatusConta.ATIVA },
      );
      expect(mockLogsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'REATIVACAO_AUTOMATICA' }),
      );
    });

    it('deve lançar NotFoundException quando fatura não é encontrada', async () => {
      mockFaturasRepository.findOne.mockResolvedValue(null);

      await expect(
        service.atualizarFatura('inexistente', { statusPagamento: StatusPagamento.PAGO }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve salvar data de pagamento quando fornecida', async () => {
      mockFaturasRepository.findOne.mockResolvedValue(
        makeFatura(StatusPagamento.PENDENTE, new Date('2025-01-01')),
      );
      mockFaturasRepository.save.mockImplementation((f) => Promise.resolve(f));

      await service.atualizarFatura('fatura-1', {
        statusPagamento: StatusPagamento.PAGO,
        dataPagamento: '2025-02-01',
      });

      const savedFatura = mockFaturasRepository.save.mock.calls[0][0] as FaturaSaas;
      expect(savedFatura.dataPagamento).toEqual(new Date('2025-02-01'));
    });
  });

  // ── getDashboard ─────────────────────────────────────────────────────────────

  describe('getDashboard()', () => {
    it('deve retornar contagens e MRR calculado corretamente', async () => {
      mockTenantsRepository.count
        .mockResolvedValueOnce(10)   // total
        .mockResolvedValueOnce(7)    // ativos
        .mockResolvedValueOnce(2);   // inadimplentes

      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ mrr: '2800.00' }),
      };
      mockTenantsRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getDashboard();

      expect(result.totalTenants).toBe(10);
      expect(result.ativos).toBe(7);
      expect(result.inadimplentes).toBe(2);
      expect(result.mrr).toBe(2800);
    });

    it('deve retornar mrr=0 quando não há tenants ativos com plano', async () => {
      mockTenantsRepository.count.mockResolvedValue(0);

      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ mrr: null }),
      };
      mockTenantsRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getDashboard();

      expect(result.mrr).toBe(0);
    });
  });
});
