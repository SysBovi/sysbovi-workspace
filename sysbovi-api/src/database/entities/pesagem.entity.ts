import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Bovino } from './bovino.entity';

export type StatusSincronizacao = 'SYNCED' | 'PENDING' | 'CONFLICT';

@Entity('pesagens')
export class Pesagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'bovino_id', type: 'uuid' })
  bovinoId: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  peso: number;

  @Column({ name: 'data_pesagem', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dataPesagem: Date;

  @Column({ name: 'gmd_calculado', type: 'decimal', precision: 8, scale: 3, nullable: true })
  gmdCalculado: number | null;

  @Column({ name: 'status_sincronizacao', type: 'varchar', length: 20, default: 'SYNCED' })
  statusSincronizacao: StatusSincronizacao;

  @Column({ type: 'int', default: 1 })
  versao: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Bovino, (bovino) => bovino.pesagens)
  @JoinColumn({ name: 'bovino_id' })
  bovino: Bovino;
}
