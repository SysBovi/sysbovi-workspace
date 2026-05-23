import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { Bovino } from '../../database/entities/bovino.entity';

@Injectable()
export class PlanoLimiteGuard implements CanActivate {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(Bovino)
    private bovinosRepository: Repository<Bovino>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    const tenant = await this.tenantsRepository.findOne({
      where: { id: user.tenantId },
      relations: ['plano'],
    });

    if (!tenant) throw new ForbiddenException('Tenant não encontrado.');

    const limiteBovinhos = tenant.plano.limiteBovinos;

    if (limiteBovinhos === null) return true;

    const totalAtual = await this.bovinosRepository.count({
      where: { tenantId: user.tenantId, status: 'ATIVO' },
    });

    if (totalAtual >= limiteBovinhos) {
      throw new ForbiddenException(
        `Limite do plano atingido (${limiteBovinhos} animais). Faça upgrade para continuar.`,
      );
    }

    return true;
  }
}
