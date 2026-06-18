import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { LogAuditoria } from '../../database/entities/log-auditoria.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(LogAuditoria)
    private logsRepository: Repository<LogAuditoria>,
  ) {}

  async findMe(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
      relations: ['plano'],
    });
    if (!tenant) throw new NotFoundException('Fazenda não encontrada.');
    return tenant;
  }

  async solicitarUpgrade(tenantId: string, planoDesejado: string): Promise<void> {
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Fazenda não encontrada.');
    const log = this.logsRepository.create({
      tenantId,
      acao: 'SOLICITAR_UPGRADE',
      detalhes: `Plano solicitado: ${planoDesejado}. Fazenda: ${tenant.nomeFazenda}.`,
    });
    await this.logsRepository.save(log);
  }
}
