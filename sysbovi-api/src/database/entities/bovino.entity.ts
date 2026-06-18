import {
  Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { LotePasto } from './lote-pasto.entity';
import { Pesagem } from './pesagem.entity';

export enum StatusBovino {
  ATIVO        = 'ATIVO',
  INATIVO      = 'INATIVO',
  VENDIDO      = 'VENDIDO',
  MORTO        = 'MORTO',
}

export enum StatusSaudeBovino {
  SAUDAVEL      = 'SAUDAVEL',
  EM_TRATAMENTO = 'EM_TRATAMENTO',
  OBSERVACAO    = 'OBSERVACAO',
}

@Unique(['tenantId', 'brinco'])
@Entity('bovinos')
export class Bovino {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'lote_id', type: 'uuid', nullable: true })
  loteId: string | null;

  @Column({ type: 'varchar', length: 50 })
  brinco: string;

  @Column({ type: 'varchar', length: 50 })
  raca: string;

  @Column({ type: 'char', length: 1 })
  sexo: 'M' | 'F';

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento: Date;

  @Column({ name: 'data_entrada', type: 'date', default: () => 'CURRENT_DATE' })
  dataEntrada: Date;

  @Column({ name: 'peso_entrada', type: 'decimal', precision: 8, scale: 2, nullable: true })
  pesoEntrada: number | null;

  @Column({ type: 'varchar', length: 20, default: 'ATIVO' })
  status: StatusBovino;

  @Column({ name: 'status_saude', type: 'varchar', length: 20, default: 'SAUDAVEL' })
  statusSaude: StatusSaudeBovino;

  @Column({
    name: 'custo_acumulado_nutricao',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  custoAcumuladoNutricao: number;

  @Column({ type: 'int', default: 1 })
  versao: number;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => LotePasto, (lote) => lote.bovinos, { nullable: true })
  @JoinColumn({ name: 'lote_id' })
  lote: LotePasto | null;

  @OneToMany(() => Pesagem, (pesagem) => pesagem.bovino)
  pesagens: Pesagem[];
}
