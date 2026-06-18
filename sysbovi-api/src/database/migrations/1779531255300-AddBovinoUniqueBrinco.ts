import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBovinoUniqueBrinco1779531255300 implements MigrationInterface {
    name = 'AddBovinoUniqueBrinco1779531255300'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bovinos" ADD CONSTRAINT "UQ_22d20f7669f86d896b266f00413" UNIQUE ("tenant_id", "brinco")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bovinos" DROP CONSTRAINT "UQ_22d20f7669f86d896b266f00413"`);
    }

}
