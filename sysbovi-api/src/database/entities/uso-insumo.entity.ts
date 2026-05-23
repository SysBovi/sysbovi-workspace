import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Insumo } from './insumo.entity';
import { LotePasto } from './lote-pasto.entity';

@Entity('uso_insumos')
export class UsoInsumo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'insumo_id', type: 'uuid' })
  insumoId: string;

  @Column({ name: 'lote_id', type: 'uuid' })
  loteId: string;

  @Column({ name: 'quantidade_utilizada', type: 'decimal', precision: 10, scale: 2 })
  quantidadeUtilizada: number;

  @Column({ name: 'valor_unitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorUnitario: number | null;

  @Column({ name: 'custo_total', type: 'decimal', precision: 10, scale: 2 })
  custoTotal: number;

  @CreateDateColumn({ name: 'data_uso' })
  dataUso: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Insumo)
  @JoinColumn({ name: 'insumo_id' })
  insumo: Insumo;

  @ManyToOne(() => LotePasto)
  @JoinColumn({ name: 'lote_id' })
  lote: LotePasto;
}
