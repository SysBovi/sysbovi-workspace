import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EquipeService } from './equipe.service';
import { MembroEquipe } from '../../database/entities/membro-equipe.entity';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockMembrosRepository = {
  find:    jest.fn(),
  findOne: jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('EquipeService', () => {
  let service: EquipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipeService,
        { provide: getRepositoryToken(MembroEquipe), useValue: mockMembrosRepository },
      ],
    }).compile();

    service = module.get<EquipeService>(EquipeService);
    jest.clearAllMocks();
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('deve retornar apenas membros ativos ordenados por nome', async () => {
      const membros = [
        { id: 'm-1', nome: 'Ana', ativo: true },
        { id: 'm-2', nome: 'Bruno', ativo: true },
      ];
      mockMembrosRepository.find.mockResolvedValue(membros);

      const result = await service.findAll('tenant-1');

      expect(result).toEqual(membros);
      expect(mockMembrosRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', ativo: true },
        order: { nome: 'ASC' },
      });
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('deve criar e retornar novo membro com tenantId correto', async () => {
      const dto = { nome: 'Dr. Carlos', email: 'carlos@fazenda.com', tipo: 'VETERINARIO' as const };
      const membro = { id: 'm-1', ...dto, tenantId: 'tenant-1', telefone: null, ativo: true };
      mockMembrosRepository.create.mockReturnValue(membro);
      mockMembrosRepository.save.mockResolvedValue(membro);

      const result = await service.create(dto, 'tenant-1');

      expect(result).toEqual(membro);
      expect(mockMembrosRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Dr. Carlos', tenantId: 'tenant-1', telefone: null }),
      );
    });

    it('deve atribuir telefone nulo quando não informado no DTO', async () => {
      const dto = { nome: 'Ana Lima', email: 'ana@fazenda.com', tipo: 'ZOOTECNISTA' as const };
      mockMembrosRepository.create.mockImplementation((data) => data);
      mockMembrosRepository.save.mockImplementation((m) => Promise.resolve(m));

      await service.create(dto, 'tenant-1');

      const criado = mockMembrosRepository.create.mock.calls[0][0];
      expect(criado.telefone).toBeNull();
    });

    it('deve preservar telefone quando informado no DTO', async () => {
      const dto = { nome: 'Pedro', email: 'pedro@faz.com', tipo: 'TECNICO' as const, telefone: '(65) 99999-0000' };
      mockMembrosRepository.create.mockImplementation((data) => data);
      mockMembrosRepository.save.mockImplementation((m) => Promise.resolve(m));

      await service.create(dto, 'tenant-1');

      const criado = mockMembrosRepository.create.mock.calls[0][0];
      expect(criado.telefone).toBe('(65) 99999-0000');
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('deve atualizar campos e retornar membro atualizado', async () => {
      const membro = { id: 'm-1', nome: 'Carlos', email: 'carlos@faz.com', tipo: 'VETERINARIO', ativo: true };
      mockMembrosRepository.findOne.mockResolvedValue(membro);
      mockMembrosRepository.save.mockImplementation((m) => Promise.resolve(m));

      const result = await service.update('m-1', { nome: 'Dr. Carlos Silva' }, 'tenant-1');

      expect(result.nome).toBe('Dr. Carlos Silva');
      expect(mockMembrosRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'm-1', tenantId: 'tenant-1', ativo: true },
      });
    });

    it('deve lançar NotFoundException quando membro não é encontrado ou está inativo', async () => {
      mockMembrosRepository.findOne.mockResolvedValue(null);

      await expect(service.update('inexistente', { nome: 'Novo' }, 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('deve marcar membro como inativo (soft delete)', async () => {
      const membro = { id: 'm-1', nome: 'Carlos', ativo: true };
      mockMembrosRepository.findOne.mockResolvedValue(membro);
      mockMembrosRepository.save.mockImplementation((m) => Promise.resolve(m));

      await service.remove('m-1', 'tenant-1');

      expect(membro.ativo).toBe(false);
      expect(mockMembrosRepository.save).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
    });

    it('deve lançar NotFoundException quando membro não existe no tenant', async () => {
      mockMembrosRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('inexistente', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
