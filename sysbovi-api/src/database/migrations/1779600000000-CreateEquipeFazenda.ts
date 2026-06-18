import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEquipeFazenda1779600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE equipe_fazenda (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        tipo VARCHAR(20) NOT NULL,
        telefone VARCHAR(20),
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_equipe_fazenda_tenant ON equipe_fazenda(tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipe_fazenda`);
  }
}
