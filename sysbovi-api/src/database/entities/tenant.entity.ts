import {
  Column, CreateDateColumn, Entity,
  JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';

export enum StatusConta {
  ATIVA        = 'ATIVA',
  INADIMPLENTE = 'INADIMPLENTE',
  BLOQUEADA    = 'BLOQUEADA',
}
import { PlanoAssinatura } from './plano-assinatura.entity';
import { Usuario } from './usuario.entity';
import { LotePasto } from './lote-pasto.entity';
import { FaturaSaas } from './fatura-saas.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome_fazenda', type: 'varchar', length: 150 })
  nomeFazenda: string;

  @Column({ name: 'plano_id', type: 'int' })
  planoId: number;

  @Column({
    name: 'status_conta',
    type: 'varchar',
    length: 20,
    default: 'ATIVA',
  })
  statusConta: StatusConta;

  @Column({ name: 'regiao_cotacao', type: 'varchar', length: 50, default: 'SP' })
  regiaoCotacao: string;

  @CreateDateColumn({ name: 'data_criacao' })
  dataCriacao: Date;

  @ManyToOne(() => PlanoAssinatura, (plano) => plano.tenants, { eager: true })
  @JoinColumn({ name: 'plano_id' })
  plano: PlanoAssinatura;

  @OneToMany(() => Usuario, (usuario) => usuario.tenant)
  usuarios: Usuario[];

  @OneToMany(() => LotePasto, (lote) => lote.tenant)
  lotes: LotePasto[];

  @OneToMany(() => FaturaSaas, (fatura) => fatura.tenant)
  faturas: FaturaSaas[];
}
