import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { FaturaSaas } from '../../database/entities/fatura-saas.entity';
import { LogAuditoria } from '../../database/entities/log-auditoria.entity';
import { AtualizarFaturaDto } from './dto/atualizar-fatura.dto';

@Injectable()
export class BackofficeService {
  constructor(
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(FaturaSaas)
    private faturasRepository: Repository<FaturaSaas>,
    @InjectRepository(LogAuditoria)
    private logsRepository: Repository<LogAuditoria>,
  ) {}

  async listTenants() {
    return this.tenantsRepository.find({ relations: ['plano'] });
  }

  async findTenant(id: string) {
    const tenant = await this.tenantsRepository.findOne({ where: { id }, relations: ['plano'] });
    if (!tenant) throw new NotFoundException('Tenant não encontrado.');
    return tenant;
  }

  async listFaturas(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.faturasRepository.find({ where, order: { dataVencimento: 'DESC' } });
  }

  async atualizarFatura(id: string, dto: AtualizarFaturaDto) {
    const fatura = await this.faturasRepository.findOne({ where: { id } });
    if (!fatura) throw new NotFoundException('Fatura não encontrada.');

    const statusAnterior = fatura.statusPagamento;
    fatura.statusPagamento = dto.statusPagamento;
    if (dto.dataPagamento) fatura.dataPagamento = new Date(dto.dataPagamento);

    await this.faturasRepository.save(fatura);

    if (dto.statusPagamento === 'ATRASADO') {
      await this.tenantsRepository.update(fatura.tenantId, { statusConta: 'INADIMPLENTE' });
      await this.registrarLog(fatura.tenantId, 'BLOQUEIO_AUTOMATICO', `Fatura ${id} vencida.`);
    }

    if (dto.statusPagamento === 'PAGO' && statusAnterior === 'ATRASADO') {
      await this.tenantsRepository.update(fatura.tenantId, { statusConta: 'ATIVA' });
      await this.registrarLog(fatura.tenantId, 'REATIVACAO_AUTOMATICA', `Fatura ${id} paga.`);
    }

    return fatura;
  }

  async listLogs(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.logsRepository.find({ where, order: { dataHora: 'DESC' }, take: 100 });
  }

  async getDashboard() {
    const [totalTenants, ativos, inadimplentes] = await Promise.all([
      this.tenantsRepository.count(),
      this.tenantsRepository.count({ where: { statusConta: 'ATIVA' } }),
      this.tenantsRepository.count({ where: { statusConta: 'INADIMPLENTE' } }),
    ]);

    const mrr = await this.tenantsRepository
      .createQueryBuilder('tenant')
      .leftJoin('tenant.plano', 'plano')
      .addSelect('SUM(plano.precoMensal)', 'mrr')
      .where('tenant.statusConta = :status', { status: 'ATIVA' })
      .getRawOne();

    return {
      totalTenants,
      ativos,
      inadimplentes,
      mrr: parseFloat(mrr?.mrr ?? '0'),
    };
  }

  private async registrarLog(tenantId: string, acao: string, detalhes: string) {
    const log = this.logsRepository.create({ tenantId, acao, detalhes });
    await this.logsRepository.save(log);
  }
}
