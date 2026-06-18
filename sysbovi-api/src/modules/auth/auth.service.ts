import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../database/entities/usuario.entity';
import { AdminUsuario } from '../../database/entities/admin-usuario.entity';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(AdminUsuario)
    private adminUsuariosRepository: Repository<AdminUsuario>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async loginUsuario(dto: LoginDto) {
    const usuario = await this.usuariosRepository.findOne({
      where: { email: dto.email, ativo: true },
      select: ['id', 'nome', 'email', 'senhaHash', 'papel', 'tenantId'],
      relations: ['tenant'],
    });

    if (!usuario || !(await bcrypt.compare(dto.senha, usuario.senhaHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    if (!usuario.tenant) {
      throw new UnauthorizedException('Conta sem fazenda associada. Entre em contato com o suporte.');
    }

    if (usuario.tenant.statusConta === 'BLOQUEADA') {
      throw new UnauthorizedException('Conta bloqueada. Entre em contato com o suporte.');
    }

    const planoNome = usuario.tenant.plano?.nome ?? 'COMUM';

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
      tenantId: usuario.tenantId,
      planoNome,
      type: 'user',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        planoNome,
        fazenda: { id: usuario.tenantId, nome: usuario.tenant.nomeFazenda },
      },
    };
  }

  async loginAdmin(dto: LoginDto) {
    const admin = await this.adminUsuariosRepository.findOne({
      where: { email: dto.email, ativo: true },
      select: ['id', 'nome', 'email', 'senhaHash'],
    });

    if (!admin || !(await bcrypt.compare(dto.senha, admin.senhaHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      papel: 'UA',
      type: 'admin',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      admin: { id: admin.id, nome: admin.nome, email: admin.email },
    };
  }

  async me(payload: { sub: string; type: string }) {
    if (payload.type === 'admin') {
      const admin = await this.adminUsuariosRepository.findOne({
        where: { id: payload.sub },
        select: ['id', 'nome', 'email'],
      });
      if (!admin) throw new UnauthorizedException();
      return { id: admin.id, nome: admin.nome, email: admin.email, papel: 'UA' };
    }

    const usuario = await this.usuariosRepository.findOne({
      where: { id: payload.sub, ativo: true },
      select: ['id', 'nome', 'email', 'papel', 'tenantId'],
      relations: ['tenant', 'tenant.plano'],
    });

    if (!usuario || !usuario.tenant) throw new UnauthorizedException();
    if (usuario.tenant.statusConta === 'BLOQUEADA') throw new UnauthorizedException('Conta bloqueada.');

    const planoNome = usuario.tenant.plano?.nome ?? 'COMUM';

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      planoNome,
      fazenda: { id: usuario.tenantId, nome: usuario.tenant.nomeFazenda },
    };
  }

  async revogarToken(user: { sub: string; iat: number; exp: number }): Promise<void> {
    const ttl = user.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redisService.set(`blacklist:${user.sub}:${user.iat}`, '1', ttl);
    }
  }
}
