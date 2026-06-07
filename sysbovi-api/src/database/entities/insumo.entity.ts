import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum TipoInsumo {
  VACINA      = 'VACINA',
  SUPLEMENTO  = 'SUPLEMENTO',
  MEDICAMENTO = 'MEDICAMENTO',
  MINERAL     = 'MINERAL',
}
export type StatusInsumo = 'NORMAL' | 'BAIXO' | 'CRITICO';

@Entity('insumos')
export class Insumo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoInsumo;

  @Column({ type: 'varchar', length: 20 })
  unidade: string;

  @Column({ name: 'quantidade_atual', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  quantidadeAtual: number;

  @Column({ name: 'custo_unitario', type: 'decimal', precision: 10, scale: 2 })
  custoUnitario: number;

  @Column({ name: 'nivel_minimo', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  nivelMinimo: number;

  @Column({ type: 'date', nullable: true })
  validade: Date | null;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
