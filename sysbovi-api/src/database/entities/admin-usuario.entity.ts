import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admin_usuarios')
export class AdminUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255, select: false })
  senhaHash: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}
