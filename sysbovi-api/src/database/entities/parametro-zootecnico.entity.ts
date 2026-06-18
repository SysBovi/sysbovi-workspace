import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { MetodoCriacao } from './lote-pasto.entity';

@Entity('parametros_zootecnicos')
export class ParametroZootecnico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'metodo_criacao', type: 'varchar', length: 20 })
  metodoCriacao: MetodoCriacao;

  @Column({ name: 'idade_meses', type: 'int' })
  idadeMeses: number;

  @Column({ name: 'peso_min_arrobas', type: 'decimal', precision: 5, scale: 2 })
  pesoMinArrobas: number;

  @Column({ name: 'peso_max_arrobas', type: 'decimal', precision: 5, scale: 2 })
  pesoMaxArrobas: number;
}
