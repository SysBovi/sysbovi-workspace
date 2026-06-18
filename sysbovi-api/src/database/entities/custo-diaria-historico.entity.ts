import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { LotePasto } from './lote-pasto.entity';

@Entity('custo_diaria_historico')
export class CustoDiariaHistorico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'lote_id', type: 'uuid' })
  loteId: string;

  @Column({ name: 'valor_diaria', type: 'decimal', precision: 10, scale: 2 })
  valorDiaria: number;

  @Column({ name: 'data_vigencia', type: 'date', default: () => 'CURRENT_DATE' })
  dataVigencia: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => LotePasto)
  @JoinColumn({ name: 'lote_id' })
  lote: LotePasto;
}
