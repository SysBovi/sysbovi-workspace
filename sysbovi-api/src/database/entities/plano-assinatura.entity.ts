import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('planos_assinatura')
export class PlanoAssinatura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  nome: string;

  @Column({ name: 'codigo_role', type: 'varchar', length: 10 })
  codigoRole: string;

  @Column({ name: 'limite_bovinos', type: 'int', nullable: true })
  limiteBovinos: number | null;

  @Column({ name: 'preco_mensal', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  precoMensal: number;

  @OneToMany(() => Tenant, (tenant) => tenant.plano)
  tenants: Tenant[];
}
