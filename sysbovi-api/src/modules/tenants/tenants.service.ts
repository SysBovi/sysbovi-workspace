import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
  ) {}

  async findMe(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
      relations: ['plano'],
    });
    if (!tenant) throw new NotFoundException('Fazenda não encontrada.');
    return tenant;
  }
}
