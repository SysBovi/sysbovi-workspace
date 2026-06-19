/**
 * Seed de produção — cria apenas dados essenciais.
 * Nunca cria tenants ou usuários de demonstração.
 *
 * Variáveis de ambiente obrigatórias:
 *   ADMIN_EMAIL    — e-mail do super admin inicial
 *   ADMIN_PASSWORD — senha do super admin inicial (mín. 12 caracteres)
 *   ADMIN_NOME     — nome do super admin (opcional, default: "Super Admin")
 *
 * Uso: npx ts-node src/database/seed-prod.ts
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { PlanoAssinatura } from './entities/plano-assinatura.entity';
import { ParametroZootecnico } from './entities/parametro-zootecnico.entity';
import { AdminUsuario } from './entities/admin-usuario.entity';

const SALT_ROUNDS = 12;

const PLANOS = [
  { nome: 'COMUM',       codigoRole: 'UC', limiteBovinos: 50,   precoMensal: 0.00 },
  { nome: 'PREMIUM',     codigoRole: 'UP', limiteBovinos: null, precoMensal: 149.00 },
  { nome: 'EMPRESARIAL', codigoRole: 'UE', limiteBovinos: null, precoMensal: 349.00 },
];

const PARAMETROS_ZOOTECNICOS = [
  { metodoCriacao: 'CONFINADO',      idadeMeses: 18, pesoMinArrobas: 14.0, pesoMaxArrobas: 16.0 },
  { metodoCriacao: 'CONFINADO',      idadeMeses: 24, pesoMinArrobas: 17.0, pesoMaxArrobas: 20.0 },
  { metodoCriacao: 'CONFINADO',      idadeMeses: 30, pesoMinArrobas: 20.0, pesoMaxArrobas: 23.0 },
  { metodoCriacao: 'SEMI_CONFINADO', idadeMeses: 18, pesoMinArrobas: 14.0, pesoMaxArrobas: 16.0 },
  { metodoCriacao: 'SEMI_CONFINADO', idadeMeses: 24, pesoMinArrobas: 17.0, pesoMaxArrobas: 20.0 },
  { metodoCriacao: 'SEMI_CONFINADO', idadeMeses: 30, pesoMinArrobas: 20.0, pesoMaxArrobas: 23.0 },
  { metodoCriacao: 'LIVRE_PASTO',    idadeMeses: 24, pesoMinArrobas: 13.0, pesoMaxArrobas: 15.0 },
  { metodoCriacao: 'LIVRE_PASTO',    idadeMeses: 30, pesoMinArrobas: 16.0, pesoMaxArrobas: 18.0 },
  { metodoCriacao: 'LIVRE_PASTO',    idadeMeses: 36, pesoMinArrobas: 18.0, pesoMaxArrobas: 20.0 },
] as const;

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`\n✖  Variável de ambiente obrigatória ausente: ${key}`);
    process.exit(1);
  }
  return value;
}

async function seedProd() {
  const adminEmail    = requireEnv('ADMIN_EMAIL');
  const adminPassword = requireEnv('ADMIN_PASSWORD');
  const adminNome     = process.env.ADMIN_NOME ?? 'Super Admin';

  if (adminPassword.length < 12) {
    console.error('\n✖  ADMIN_PASSWORD deve ter no mínimo 12 caracteres.');
    process.exit(1);
  }

  await AppDataSource.initialize();
  console.log('✔  Banco conectado\n');

  const planoRepo     = AppDataSource.getRepository(PlanoAssinatura);
  const parametroRepo = AppDataSource.getRepository(ParametroZootecnico);
  const adminRepo     = AppDataSource.getRepository(AdminUsuario);

  // 1. Planos
  console.log('── Planos ──────────────────────────────────');
  for (const p of PLANOS) {
    const existe = await planoRepo.findOneBy({ nome: p.nome });
    if (!existe) {
      await planoRepo.save(planoRepo.create(p));
      console.log(`  [CRIADO] ${p.nome}`);
    } else {
      console.log(`  [OK]     ${p.nome} já existe`);
    }
  }

  // 2. Parâmetros Zootécnicos
  console.log('\n── Parâmetros Zootécnicos ──────────────────');
  const total = await parametroRepo.count();
  if (total === 0) {
    for (const p of PARAMETROS_ZOOTECNICOS) {
      await parametroRepo.save(parametroRepo.create(p as any));
    }
    console.log(`  [CRIADO] ${PARAMETROS_ZOOTECNICOS.length} parâmetros inseridos`);
  } else {
    console.log(`  [OK]     ${total} parâmetros já existem`);
  }

  // 3. Super Admin
  console.log('\n── Super Admin ─────────────────────────────');
  const adminExiste = await adminRepo.findOneBy({ email: adminEmail });
  if (!adminExiste) {
    const senhaHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await adminRepo.save(adminRepo.create({ nome: adminNome, email: adminEmail, senhaHash }));
    console.log(`  [CRIADO] ${adminEmail}  [UA]`);
  } else {
    console.log(`  [OK]     ${adminEmail} já existe`);
  }

  await AppDataSource.destroy();
  console.log('\n✔  Seed de produção concluído.\n');
}

seedProd().catch((err) => {
  console.error('\n✖  Erro no seed:', err.message ?? err);
  process.exit(1);
});
