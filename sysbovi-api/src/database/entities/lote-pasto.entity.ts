import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Bovino } from './bovino.entity';

export type MetodoCriacao = 'LIVRE_PASTO' | 'SEMI_CONFINADO' | 'CONFINADO';
export type StatusOcupacao = 'NORMAL' | 'SUPERLOTADO';
export type AlertaMassaForrageira = 'NORMAL' | 'BAIXA' | 'CRITICA';

@Entity('lotes_pastos')
export class LotePasto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'int' })
  capacidade: number;

  @Column({ name: 'area_hectares', type: 'decimal', precision: 8, scale: 2, nullable: true })
  areaHectares: number | null;

  @Column({ name: 'ultimo_rodizio', type: 'date', nullable: true })
  ultimoRodizio: Date | null;

  @Column({ name: 'dias_descanso', type: 'int', default: 30 })
  diasDescanso: number;

  @Column({ name: 'status_ocupacao', type: 'varchar', length: 20, default: 'NORMAL' })
  statusOcupacao: StatusOcupacao;

  @Column({ name: 'metodo_criacao', type: 'varchar', length: 20, default: 'LIVRE_PASTO' })
  metodoCriacao: MetodoCriacao;

  @Column({ name: 'alerta_massa_forrageira', type: 'varchar', length: 10, default: 'NORMAL' })
  alertaMassaForrageira: AlertaMassaForrageira;

  @ManyToOne(() => Tenant, (tenant) => tenant.lotes)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => Bovino, (bovino) => bovino.lote)
  bovinos: Bovino[];
}
