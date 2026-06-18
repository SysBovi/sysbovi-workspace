import {
  Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum PapelUsuario {
  ADMIN_FAZENDA = 'ADMIN_FAZENDA',
  ESPECIALISTA  = 'ESPECIALISTA',
  COMUM         = 'COMUM',
}

@Unique(['tenantId', 'email'])
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 150 })
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
