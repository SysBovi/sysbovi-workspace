import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { Tenant } from '../../database/entities/tenant.entity';
import { LogAuditoria } from '../../database/entities/log-auditoria.entity';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockTenantsRepository = {
  findOne: jest.fn(),
};

const mockLogsRepository = {
  create: jest.fn(),
  save:   jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('TenantsService', () => {
  let service: TenantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: getRepositoryToken(Tenant),       useValue: mockTenantsRepository },
        { provide: getRepositoryToken(LogAuditoria), useValue: mockLogsRepository },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jest.clearAllMocks();
  });

  // ── findMe ──────────────────────────────────────────────────────────────────

  describe('findMe()', () => {
    it('deve retornar o tenant com relação de plano quando encontrado', async () => {
      const tenant = { id: 'tenant-1', nomeFazenda: 'Fazenda Demo', plano: { nome: 'PREMIUM' } };
      mockTenantsRepository.findOne.mockResolvedValue(tenant);

      const result = await service.findMe('tenant-1');

      expect(result).toEqual(tenant);
      expect(mockTenantsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        relations: ['plano'],
      });
    });

    it('deve lançar NotFoundException quando tenant não existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(null);

      await expect(service.findMe('inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ── solicitarUpgrade ────────────────────────────────────────────────────────

  describe('solicitarUpgrade()', () => {
    it('deve criar log de auditoria com plano desejado e nome da fazenda', async () => {
      const tenant = { id: 'tenant-1', nomeFazenda: 'Fazenda Boa Vista' };
      mockTenantsRepository.findOne.mockResolvedValue(tenant);
      const logMock = { id: 'log-1' };
      mockLogsRepository.create.mockReturnValue(logMock);
      mockLogsRepository.save.mockResolvedValue(logMock);

      await service.solicitarUpgrade('tenant-1', 'EMPRESARIAL');

      expect(mockLogsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          acao: 'SOLICITAR_UPGRADE',
          detalhes: expect.stringContaining('EMPRESARIAL'),
        }),
      );
      expect(mockLogsRepository.save).toHaveBeenCalledWith(logMock);
    });

    it('deve incluir o nome da fazenda no log de upgrade', async () => {
      const tenant = { id: 'tenant-1', nomeFazenda: 'Fazenda Beira Rio' };
      mockTenantsRepository.findOne.mockResolvedValue(tenant);
      mockLogsRepository.create.mockImplementation((data) => data);
      mockLogsRepository.save.mockResolvedValue({});

      await service.solicitarUpgrade('tenant-1', 'PREMIUM');

      const logCriado = mockLogsRepository.create.mock.calls[0][0];
      expect(logCriado.detalhes).toContain('Fazenda Beira Rio');
    });

    it('deve lançar NotFoundException quando tenant não existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(null);

      await expect(service.solicitarUpgrade('inexistente', 'PREMIUM')).rejects.toThrow(NotFoundException);
    });
  });
});
