import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export type StatusResolucao = 'PENDENTE' | 'RESOLVIDO' | 'DESCARTADO';

@Entity('sync_quarentena')
export class SyncQuarentena {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'tabela_afetada', type: 'varchar', length: 50 })
  tabelaAfetada: string;

  @Column({ name: 'registro_id', type: 'uuid' })
  registroId: string;

  @Column({ name: 'dados_conflitantes', type: 'jsonb' })
  dadosConflitantes: Record<string, any>;

  @Column({ type: 'varchar', length: 255 })
  motivo: string;

  @Column({ name: 'status_resolucao', type: 'varchar', length: 20, default: 'PENDENTE' })
  statusResolucao: StatusResolucao;

  @CreateDateColumn({ name: 'data_conflito' })
  dataConflito: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
