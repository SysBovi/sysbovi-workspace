import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export type StatusPagamento = 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'CANCELADO';

@Entity('faturas_saas')
export class FaturaSaas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ name: 'data_vencimento', type: 'date' })
  dataVencimento: Date;

  @Column({ name: 'data_pagamento', type: 'date', nullable: true })
  dataPagamento: Date | null;

  @Column({ name: 'status_pagamento', type: 'varchar', length: 20, default: 'PENDENTE' })
  statusPagamento: StatusPagamento;

  @ManyToOne(() => Tenant, (tenant) => tenant.faturas)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
