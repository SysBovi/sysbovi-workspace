import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export type PapelUsuario = 'ADMIN_FAZENDA' | 'ESPECIALISTA' | 'COMUM';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255, select: false })
  senhaHash: string;

  @Column({ type: 'varchar', length: 20 })
  papel: PapelUsuario;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @ManyToOne(() => Tenant, (tenant) => tenant.usuarios)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
