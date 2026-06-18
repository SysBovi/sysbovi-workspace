import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1779528656098 implements MigrationInterface {
    name = 'InitialSchema1779528656098'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "planos_assinatura" ("id" SERIAL NOT NULL, "nome" character varying(50) NOT NULL, "codigo_role" character varying(10) NOT NULL, "limite_bovinos" integer, "preco_mensal" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_f37549d595ada0b26f9361ff1df" UNIQUE ("nome"), CONSTRAINT "PK_bcede0b411450562e858a540e19" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pesagens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "bovino_id" uuid NOT NULL, "peso" numeric(8,2) NOT NULL, "data_pesagem" TIMESTAMP NOT NULL DEFAULT now(), "gmd_calculado" numeric(8,3), "status_sincronizacao" character varying(20) NOT NULL DEFAULT 'SYNCED', "versao" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_c0226d7235336c0f23834eea06a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bovinos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "lote_id" uuid, "brinco" character varying(50) NOT NULL, "raca" character varying(50) NOT NULL, "sexo" character(1) NOT NULL, "data_nascimento" date NOT NULL, "data_entrada" date NOT NULL DEFAULT ('now'::text)::date, "peso_entrada" numeric(8,2), "status" character varying(20) NOT NULL DEFAULT 'ATIVO', "status_saude" character varying(20) NOT NULL DEFAULT 'SAUDAVEL', "custo_acumulado_nutricao" numeric(10,2) NOT NULL DEFAULT '0', "versao" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_de3a24cfd1565c672393a77a13b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lotes_pastos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "nome" character varying(100) NOT NULL, "capacidade" integer NOT NULL, "area_hectares" numeric(8,2), "ultimo_rodizio" date, "dias_descanso" integer NOT NULL DEFAULT '30', "status_ocupacao" character varying(20) NOT NULL DEFAULT 'NORMAL', "metodo_criacao" character varying(20) NOT NULL DEFAULT 'LIVRE_PASTO', "alerta_massa_forrageira" character varying(10) NOT NULL DEFAULT 'NORMAL', CONSTRAINT "PK_31add2984216c02c345e9f27d4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "faturas_saas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "valor" numeric(10,2) NOT NULL, "data_vencimento" date NOT NULL, "data_pagamento" date, "status_pagamento" character varying(20) NOT NULL DEFAULT 'PENDENTE', CONSTRAINT "PK_7631bd6a83ba359740184e78df1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome_fazenda" character varying(150) NOT NULL, "plano_id" integer NOT NULL, "status_conta" character varying(20) NOT NULL DEFAULT 'ATIVA', "regiao_cotacao" character varying(50) NOT NULL DEFAULT 'SP', "data_criacao" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "nome" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "senha_hash" character varying(255) NOT NULL, "papel" character varying(20) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "insumos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "nome" character varying(150) NOT NULL, "tipo" character varying(20) NOT NULL, "unidade" character varying(20) NOT NULL, "quantidade_atual" numeric(10,2) NOT NULL DEFAULT '0', "custo_unitario" numeric(10,2) NOT NULL, "nivel_minimo" numeric(10,2) NOT NULL DEFAULT '0', "validade" date, CONSTRAINT "PK_b4e1b727a7b140e698e3a3dc7af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "uso_insumos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "insumo_id" uuid NOT NULL, "lote_id" uuid NOT NULL, "quantidade_utilizada" numeric(10,2) NOT NULL, "valor_unitario" numeric(10,2), "custo_total" numeric(10,2) NOT NULL, "data_uso" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e074bb256177216a5e8c9220d6f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sync_quarentena" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "tabela_afetada" character varying(50) NOT NULL, "registro_id" uuid NOT NULL, "dados_conflitantes" jsonb NOT NULL, "motivo" character varying(255) NOT NULL, "status_resolucao" character varying(20) NOT NULL DEFAULT 'PENDENTE', "data_conflito" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3de5a658c088efbc90b370d4d61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "parametros_zootecnicos" ("id" SERIAL NOT NULL, "metodo_criacao" character varying(20) NOT NULL, "idade_meses" integer NOT NULL, "peso_min_arrobas" numeric(5,2) NOT NULL, "peso_max_arrobas" numeric(5,2) NOT NULL, CONSTRAINT "PK_1dfe2eafd1b4f6d8f408d3a2569" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "logs_auditoria" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid, "usuario_id" uuid, "acao" character varying(100) NOT NULL, "detalhes" text, "data_hora" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_034892b883599b2857c75d5d639" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "custo_diaria_historico" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL, "lote_id" uuid NOT NULL, "valor_diaria" numeric(10,2) NOT NULL, "data_vigencia" date NOT NULL DEFAULT ('now'::text)::date, CONSTRAINT "PK_558786f28364ead406a866903d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_usuarios" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "senha_hash" character varying(255) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_bba05c3318e7280a309ae1051a0" UNIQUE ("email"), CONSTRAINT "PK_3aeec5a3acce09b05609fd6b809" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pesagens" ADD CONSTRAINT "FK_5d643e07cb55b9e2e8db802e69c" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pesagens" ADD CONSTRAINT "FK_b6ddf41e697ff9ab7a03f806c30" FOREIGN KEY ("bovino_id") REFERENCES "bovinos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bovinos" ADD CONSTRAINT "FK_c01cb447eae4ef7d7bcec92a1bc" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bovinos" ADD CONSTRAINT "FK_7b8924399d496864aafbb8d6b18" FOREIGN KEY ("lote_id") REFERENCES "lotes_pastos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lotes_pastos" ADD CONSTRAINT "FK_7631b5e77c94ea7937c2b4ec5c0" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "faturas_saas" ADD CONSTRAINT "FK_9c961980e450690ba65a121a829" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "FK_d2b063df70c9b03fdd95b6c2d97" FOREIGN KEY ("plano_id") REFERENCES "planos_assinatura"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_7b664ae6b7cda3df230794ff6c1" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insumos" ADD CONSTRAINT "FK_3332ad03eef3c9da283795187db" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "uso_insumos" ADD CONSTRAINT "FK_892f596730099a477242ced3218" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "uso_insumos" ADD CONSTRAINT "FK_c9916ca5f9bb42b331407e28423" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "uso_insumos" ADD CONSTRAINT "FK_9549879a66299b4d7ce8f3c2bd8" FOREIGN KEY ("lote_id") REFERENCES "lotes_pastos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sync_quarentena" ADD CONSTRAINT "FK_3e5e8e031a9b8f5ed02b000cce8" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "logs_auditoria" ADD CONSTRAINT "FK_f4c62ebbcdbd5e59fd2fe095ce6" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "logs_auditoria" ADD CONSTRAINT "FK_40a1967a69863f775a46300313b" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "custo_diaria_historico" ADD CONSTRAINT "FK_a57a3589d19ee16b988db6efa8e" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "custo_diaria_historico" ADD CONSTRAINT "FK_6a7665fbbcb2a696d3a468267e8" FOREIGN KEY ("lote_id") REFERENCES "lotes_pastos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Índices de performance
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_bovinos_tenant_brinco" ON "bovinos" ("tenant_id", "brinco")`);
        await queryRunner.query(`CREATE INDEX "IDX_bovinos_tenant_lote"     ON "bovinos" ("tenant_id", "lote_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_bovinos_tenant_status"   ON "bovinos" ("tenant_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_pesagens_bovino"         ON "pesagens" ("bovino_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_pesagens_bovino_data"    ON "pesagens" ("bovino_id", "data_pesagem" DESC)`);
        await queryRunner.query(`CREATE INDEX "IDX_uso_insumos_lote"        ON "uso_insumos" ("lote_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_insumos_tenant"          ON "insumos" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_faturas_tenant"          ON "faturas_saas" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_logs_tenant"             ON "logs_auditoria" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_sync_quarentena_tenant"  ON "sync_quarentena" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_custo_diaria_lote"       ON "custo_diaria_historico" ("lote_id", "data_vigencia" DESC)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custo_diaria_historico" DROP CONSTRAINT "FK_6a7665fbbcb2a696d3a468267e8"`);
        await queryRunner.query(`ALTER TABLE "custo_diaria_historico" DROP CONSTRAINT "FK_a57a3589d19ee16b988db6efa8e"`);
        await queryRunner.query(`ALTER TABLE "logs_auditoria" DROP CONSTRAINT "FK_40a1967a69863f775a46300313b"`);
        await queryRunner.query(`ALTER TABLE "logs_auditoria" DROP CONSTRAINT "FK_f4c62ebbcdbd5e59fd2fe095ce6"`);
        await queryRunner.query(`ALTER TABLE "sync_quarentena" DROP CONSTRAINT "FK_3e5e8e031a9b8f5ed02b000cce8"`);
        await queryRunner.query(`ALTER TABLE "uso_insumos" DROP CONSTRAINT "FK_9549879a66299b4d7ce8f3c2bd8"`);
        await queryRunner.query(`ALTER TABLE "uso_insumos" DROP CONSTRAINT "FK_c9916ca5f9bb42b331407e28423"`);
        await queryRunner.query(`ALTER TABLE "uso_insumos" DROP CONSTRAINT "FK_892f596730099a477242ced3218"`);
        await queryRunner.query(`ALTER TABLE "insumos" DROP CONSTRAINT "FK_3332ad03eef3c9da283795187db"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_7b664ae6b7cda3df230794ff6c1"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "FK_d2b063df70c9b03fdd95b6c2d97"`);
        await queryRunner.query(`ALTER TABLE "faturas_saas" DROP CONSTRAINT "FK_9c961980e450690ba65a121a829"`);
        await queryRunner.query(`ALTER TABLE "lotes_pastos" DROP CONSTRAINT "FK_7631b5e77c94ea7937c2b4ec5c0"`);
        await queryRunner.query(`ALTER TABLE "bovinos" DROP CONSTRAINT "FK_7b8924399d496864aafbb8d6b18"`);
        await queryRunner.query(`ALTER TABLE "bovinos" DROP CONSTRAINT "FK_c01cb447eae4ef7d7bcec92a1bc"`);
        await queryRunner.query(`ALTER TABLE "pesagens" DROP CONSTRAINT "FK_b6ddf41e697ff9ab7a03f806c30"`);
        await queryRunner.query(`ALTER TABLE "pesagens" DROP CONSTRAINT "FK_5d643e07cb55b9e2e8db802e69c"`);
        await queryRunner.query(`DROP TABLE "admin_usuarios"`);
        await queryRunner.query(`DROP TABLE "custo_diaria_historico"`);
        await queryRunner.query(`DROP TABLE "logs_auditoria"`);
        await queryRunner.query(`DROP TABLE "parametros_zootecnicos"`);
        await queryRunner.query(`DROP TABLE "sync_quarentena"`);
        await queryRunner.query(`DROP TABLE "uso_insumos"`);
        await queryRunner.query(`DROP TABLE "insumos"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TABLE "faturas_saas"`);
        await queryRunner.query(`DROP TABLE "lotes_pastos"`);
        await queryRunner.query(`DROP TABLE "bovinos"`);
        await queryRunner.query(`DROP TABLE "pesagens"`);
        await queryRunner.query(`DROP TABLE "planos_assinatura"`);

        // Índices de performance
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_custo_diaria_lote"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sync_quarentena_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_logs_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_faturas_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_insumos_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_uso_insumos_lote"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pesagens_bovino_data"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pesagens_bovino"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bovinos_tenant_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bovinos_tenant_lote"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_bovinos_tenant_brinco"`);
    }

}
