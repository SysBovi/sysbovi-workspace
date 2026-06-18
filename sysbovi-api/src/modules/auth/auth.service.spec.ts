import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Usuario } from '../../database/entities/usuario.entity';
import { AdminUsuario } from '../../database/entities/admin-usuario.entity';
import { RedisService } from '../../redis/redis.service';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockUsuariosRepository = {
  findOne: jest.fn(),
};

const mockAdminUsuariosRepository = {
  findOne: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mocked.jwt.token'),
};

const mockRedisService = {
  set: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  del: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario),      useValue: mockUsuariosRepository },
        { provide: getRepositoryToken(AdminUsuario), useValue: mockAdminUsuariosRepository },
        { provide: JwtService,                       useValue: mockJwtService },
        { provide: RedisService,                     useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── loginUsuario ────────────────────────────────────────────────────────

  describe('loginUsuario()', () => {
    it('deve retornar accessToken e dados do usuário com credenciais válidas', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      mockUsuariosRepository.findOne.mockResolvedValue({
        id: 'uuid-1',
        nome: 'Proprietário Premium',
        email: 'premium@fazendademo.com',
        senhaHash,
        papel: 'ADMIN_FAZENDA',
        tenantId: 'tenant-uuid',
        tenant: { statusConta: 'ATIVA', nomeFazenda: 'Fazenda Premium' },
      });

      const result = await service.loginUsuario({
        email: 'premium@fazendademo.com',
        senha: 'senha123',
      });

      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.usuario.email).toBe('premium@fazendademo.com');
      expect(result.usuario.papel).toBe('ADMIN_FAZENDA');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'premium@fazendademo.com', type: 'user' }),
      );
    });

    it('deve lançar UnauthorizedException com senha incorreta', async () => {
      const senhaHash = await bcrypt.hash('correta123', 10);
      mockUsuariosRepository.findOne.mockResolvedValue({
        id: 'uuid-1',
        senhaHash,
        tenant: { statusConta: 'ATIVA' },
      });

      await expect(
        service.loginUsuario({ email: 'user@test.com', senha: 'errada999' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando usuário não é encontrado', async () => {
      mockUsuariosRepository.findOne.mockResolvedValue(null);

      await expect(
        service.loginUsuario({ email: 'inexistente@test.com', senha: 'qualquer' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando conta está BLOQUEADA', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      mockUsuariosRepository.findOne.mockResolvedValue({
        id: 'uuid-2',
        senhaHash,
        tenant: { statusConta: 'BLOQUEADA' },
      });

      await expect(
        service.loginUsuario({ email: 'bloqueado@test.com', senha: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── loginAdmin ──────────────────────────────────────────────────────────

  describe('loginAdmin()', () => {
    it('deve retornar accessToken com papel UA para admin válido', async () => {
      const senhaHash = await bcrypt.hash('admin123', 10);
      mockAdminUsuariosRepository.findOne.mockResolvedValue({
        id: 'admin-uuid',
        nome: 'Super Admin',
        email: 'superadmin@sysbovi.com',
        senhaHash,
      });

      const result = await service.loginAdmin({
        email: 'superadmin@sysbovi.com',
        senha: 'admin123',
      });

      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ papel: 'UA', type: 'admin' }),
      );
    });

    it('deve lançar UnauthorizedException com credenciais admin inválidas', async () => {
      mockAdminUsuariosRepository.findOne.mockResolvedValue(null);

      await expect(
        service.loginAdmin({ email: 'fake@admin.com', senha: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── me ──────────────────────────────────────────────────────────────────

  describe('me()', () => {
    it('deve retornar dados do admin com papel UA quando type=admin', async () => {
      mockAdminUsuariosRepository.findOne.mockResolvedValue({
        id: 'admin-uuid',
        nome: 'Super Admin',
        email: 'superadmin@sysbovi.com',
      });

      const result = await service.me({ sub: 'admin-uuid', type: 'admin' });

      expect(result).toEqual({
        id: 'admin-uuid',
        nome: 'Super Admin',
        email: 'superadmin@sysbovi.com',
        papel: 'UA',
      });
      expect(mockAdminUsuariosRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'admin-uuid' } }),
      );
    });

    it('deve lançar UnauthorizedException quando admin não é encontrado', async () => {
      mockAdminUsuariosRepository.findOne.mockResolvedValue(null);

      await expect(
        service.me({ sub: 'inexistente-uuid', type: 'admin' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve retornar dados completos do usuário com planoNome e fazenda quando type=user', async () => {
      mockUsuariosRepository.findOne.mockResolvedValue({
        id: 'user-uuid',
        nome: 'Proprietário',
        email: 'prop@fazenda.com',
        papel: 'ADMIN_FAZENDA',
        tenantId: 'tenant-uuid',
        tenant: {
          statusConta: 'ATIVA',
          nomeFazenda: 'Fazenda Bela Vista',
          plano: { nome: 'PREMIUM' },
        },
      });

      const result = await service.me({ sub: 'user-uuid', type: 'user' });

      expect(result).toEqual({
        id: 'user-uuid',
        nome: 'Proprietário',
        email: 'prop@fazenda.com',
        papel: 'ADMIN_FAZENDA',
        planoNome: 'PREMIUM',
        fazenda: { id: 'tenant-uuid', nome: 'Fazenda Bela Vista' },
      });
    });

    it('deve lançar UnauthorizedException quando conta do usuário está BLOQUEADA', async () => {
      mockUsuariosRepository.findOne.mockResolvedValue({
        id: 'user-uuid',
        nome: 'Bloqueado',
        email: 'bloqueado@fazenda.com',
        papel: 'ADMIN_FAZENDA',
        tenantId: 'tenant-uuid',
        tenant: { statusConta: 'BLOQUEADA', nomeFazenda: 'Fazenda X', plano: null },
      });

      await expect(
        service.me({ sub: 'user-uuid', type: 'user' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── revogarToken ────────────────────────────────────────────────────────

  describe('revogarToken()', () => {
    it('deve registrar o token na blacklist do Redis com TTL correto', async () => {
      const now = Math.floor(Date.now() / 1000);
      const user = { sub: 'user-uuid', iat: now - 100, exp: now + 500 };

      await service.revogarToken(user);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        `blacklist:${user.sub}:${user.iat}`,
        '1',
        expect.any(Number),
      );

      const [, , ttl] = mockRedisService.set.mock.calls[0];
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(500);
    });

    it('não deve chamar Redis se o token já está expirado', async () => {
      const now = Math.floor(Date.now() / 1000);
      const user = { sub: 'user-uuid', iat: now - 1000, exp: now - 1 };

      await service.revogarToken(user);

      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });
});
