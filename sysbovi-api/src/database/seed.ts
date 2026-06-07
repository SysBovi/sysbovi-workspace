import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { PlanoAssinatura } from './entities/plano-assinatura.entity';
import { ParametroZootecnico } from './entities/parametro-zootecnico.entity';
import { Tenant, StatusConta } from './entities/tenant.entity';
import { Usuario, PapelUsuario } from './entities/usuario.entity';
import { AdminUsuario } from './entities/admin-usuario.entity';
import { LotePasto, MetodoCriacao, StatusOcupacao } from './entities/lote-pasto.entity';
import { Bovino, StatusBovino, StatusSaudeBovino } from './entities/bovino.entity';
import { Pesagem } from './entities/pesagem.entity';
import { Insumo, TipoInsumo } from './entities/insumo.entity';

const SALT_ROUNDS = 10;

// ─── Planos ───────────────────────────────────────────────────────────────────

const PLANOS = [
  { nome: 'COMUM',       codigoRole: 'UC', limiteBovinos: 50,   precoMensal: 0.00 },
  { nome: 'PREMIUM',     codigoRole: 'UP', limiteBovinos: null, precoMensal: 149.00 },
  { nome: 'EMPRESARIAL', codigoRole: 'UE', limiteBovinos: null, precoMensal: 349.00 },
];

// ─── Tenants de teste (um por plano) ─────────────────────────────────────────

const TENANTS_SEED = [
  { nomeFazenda: 'Fazenda Comum',       planoNome: 'COMUM',       regiaoCotacao: 'MT' },
  { nomeFazenda: 'Fazenda Premium',     planoNome: 'PREMIUM',     regiaoCotacao: 'MT' },
  { nomeFazenda: 'Fazenda Empresarial', planoNome: 'EMPRESARIAL', regiaoCotacao: 'SP' },
];

// ─── Usuários de tenant ───────────────────────────────────────────────────────

const USUARIOS_SEED = [
  {
    nome: 'Proprietário Comum',
    email: 'comum@fazendademo.com',
    senha: 'comum123',
    papel: PapelUsuario.ADMIN_FAZENDA,
    tenantFazenda: 'Fazenda Comum',
  },
  {
    nome: 'Proprietário Premium',
    email: 'premium@fazendademo.com',
    senha: 'premium123',
    papel: PapelUsuario.ADMIN_FAZENDA,
    tenantFazenda: 'Fazenda Premium',
  },
  {
    nome: 'Proprietário Empresarial',
    email: 'empresarial@fazendademo.com',
    senha: 'empresarial123',
    papel: PapelUsuario.ADMIN_FAZENDA,
    tenantFazenda: 'Fazenda Empresarial',
  },
  {
    nome: 'Especialista Demo',
    email: 'especialista@fazendademo.com',
    senha: 'espec123',
    papel: PapelUsuario.ESPECIALISTA,
    tenantFazenda: 'Fazenda Premium',
  },
];

// ─── Parâmetros Zootécnicos ───────────────────────────────────────────────────

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

// ─── Super Admin UA ───────────────────────────────────────────────────────────

const ADMIN_SEED = {
  nome: 'Super Admin SysBovi',
  email: 'superadmin@sysbovi.com',
  senha: 'superadmin123',
};

// ─── Dados de demonstração (Fazenda Premium) ──────────────────────────────────

const PASTOS_DEMO = [
  { nome: 'Pasto A1 - Braquiária', capacidade: 40, areaHectares: 50.0, diasDescanso: 30, metodoCriacao: MetodoCriacao.LIVRE_PASTO },
  { nome: 'Pasto B2 - Mombaça',    capacidade: 25, areaHectares: 30.0, diasDescanso: 28, metodoCriacao: MetodoCriacao.LIVRE_PASTO },
  { nome: 'Pasto C3 - Tifton',     capacidade: 15, areaHectares: 20.0, diasDescanso: 25, metodoCriacao: MetodoCriacao.LIVRE_PASTO },
];

const INSUMOS_DEMO = [
  { nome: 'Vacina Aftosa',         tipo: TipoInsumo.VACINA,      unidade: 'dose',   quantidadeAtual: 150, custoUnitario: 8.50,  nivelMinimo: 50,  validade: '2026-12-31' },
  { nome: 'Sal Mineral Bovitrace', tipo: TipoInsumo.MINERAL,     unidade: 'kg',     quantidadeAtual: 200, custoUnitario: 3.20,  nivelMinimo: 80,  validade: '2027-06-30' },
  { nome: 'Ivermectina 1%',        tipo: TipoInsumo.MEDICAMENTO, unidade: 'ml',     quantidadeAtual: 25,  custoUnitario: 12.00, nivelMinimo: 60,  validade: '2026-09-15' },
  { nome: 'Suplemento Proteico',   tipo: TipoInsumo.SUPLEMENTO,  unidade: 'kg',     quantidadeAtual: 85,  custoUnitario: 5.50,  nivelMinimo: 100, validade: '2026-08-01' },
  { nome: 'Oxitetraciclina',       tipo: TipoInsumo.MEDICAMENTO, unidade: 'frasco', quantidadeAtual: 12,  custoUnitario: 45.00, nivelMinimo: 5,   validade: '2026-11-20' },
];

// Bovinos: [brinco, raça, sexo, dataNascimento, pesoEntrada, pastoIndex, custoAcum, pesagens[]]
const BOVINOS_DEMO: Array<{
  brinco: string; raca: string; sexo: 'M' | 'F';
  dataNascimento: string; pesoEntrada: number; pastoIdx: number;
  custoAcumulado: number;
  pesagens: Array<{ peso: number; daysAgo: number }>;
}> = [
  { brinco: 'BOV-001', raca: 'Nelore',  sexo: 'M', dataNascimento: '2022-01-15', pesoEntrada: 220, pastoIdx: 0, custoAcumulado: 1250.00, pesagens: [{ peso: 320, daysAgo: 120 }, { peso: 385, daysAgo: 60 }, { peso: 455, daysAgo: 5 }] },
  { brinco: 'BOV-002', raca: 'Nelore',  sexo: 'M', dataNascimento: '2022-03-20', pesoEntrada: 215, pastoIdx: 0, custoAcumulado: 1180.00, pesagens: [{ peso: 308, daysAgo: 115 }, { peso: 372, daysAgo: 55 }, { peso: 438, daysAgo: 5 }] },
  { brinco: 'BOV-003', raca: 'Angus',   sexo: 'M', dataNascimento: '2021-06-10', pesoEntrada: 230, pastoIdx: 0, custoAcumulado: 1890.00, pesagens: [{ peso: 390, daysAgo: 110 }, { peso: 485, daysAgo: 50 }, { peso: 568, daysAgo: 5 }] },
  { brinco: 'BOV-004', raca: 'Nelore',  sexo: 'F', dataNascimento: '2022-09-05', pesoEntrada: 180, pastoIdx: 0, custoAcumulado: 920.00,  pesagens: [{ peso: 258, daysAgo: 100 }, { peso: 312, daysAgo: 45 }, { peso: 365, daysAgo: 5 }] },
  { brinco: 'BOV-005', raca: 'Brahman', sexo: 'M', dataNascimento: '2022-02-28', pesoEntrada: 225, pastoIdx: 1, custoAcumulado: 1340.00, pesagens: [{ peso: 332, daysAgo: 118 }, { peso: 402, daysAgo: 58 }, { peso: 472, daysAgo: 5 }] },
  { brinco: 'BOV-006', raca: 'Brahman', sexo: 'M', dataNascimento: '2021-11-12', pesoEntrada: 240, pastoIdx: 1, custoAcumulado: 1760.00, pesagens: [{ peso: 378, daysAgo: 112 }, { peso: 462, daysAgo: 52 }, { peso: 534, daysAgo: 5 }] },
  { brinco: 'BOV-007', raca: 'Senepol', sexo: 'M', dataNascimento: '2021-08-22', pesoEntrada: 235, pastoIdx: 1, custoAcumulado: 2050.00, pesagens: [{ peso: 402, daysAgo: 105 }, { peso: 495, daysAgo: 48 }, { peso: 572, daysAgo: 5 }] },
  { brinco: 'BOV-008', raca: 'Nelore',  sexo: 'F', dataNascimento: '2022-05-18', pesoEntrada: 175, pastoIdx: 1, custoAcumulado: 880.00,  pesagens: [{ peso: 242, daysAgo: 95 }, { peso: 288, daysAgo: 40 }, { peso: 334, daysAgo: 5 }] },
  { brinco: 'BOV-009', raca: 'Angus',   sexo: 'M', dataNascimento: '2022-07-30', pesoEntrada: 220, pastoIdx: 2, custoAcumulado: 1120.00, pesagens: [{ peso: 308, daysAgo: 105 }, { peso: 362, daysAgo: 48 }, { peso: 415, daysAgo: 5 }] },
  { brinco: 'BOV-010', raca: 'Nelore',  sexo: 'M', dataNascimento: '2021-12-05', pesoEntrada: 245, pastoIdx: 2, custoAcumulado: 1980.00, pesagens: [{ peso: 395, daysAgo: 108 }, { peso: 478, daysAgo: 50 }, { peso: 553, daysAgo: 5 }] },
  { brinco: 'BOV-011', raca: 'Brahman', sexo: 'M', dataNascimento: '2023-03-10', pesoEntrada: 200, pastoIdx: 2, custoAcumulado: 650.00,  pesagens: [{ peso: 285, daysAgo: 80 }, { peso: 322, daysAgo: 30 }] },
  { brinco: 'BOV-012', raca: 'Nelore',  sexo: 'F', dataNascimento: '2022-11-25', pesoEntrada: 170, pastoIdx: -1, custoAcumulado: 480.00, pesagens: [{ peso: 255, daysAgo: 75 }, { peso: 298, daysAgo: 25 }] },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log('✔  Banco conectado\n');

  const planoRepo      = AppDataSource.getRepository(PlanoAssinatura);
  const parametroRepo  = AppDataSource.getRepository(ParametroZootecnico);
  const tenantRepo     = AppDataSource.getRepository(Tenant);
  const usuarioRepo    = AppDataSource.getRepository(Usuario);
  const adminRepo      = AppDataSource.getRepository(AdminUsuario);
  const loteRepo       = AppDataSource.getRepository(LotePasto);
  const bovinoRepo     = AppDataSource.getRepository(Bovino);
  const pesagemRepo    = AppDataSource.getRepository(Pesagem);
  const insumoRepo     = AppDataSource.getRepository(Insumo);

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
  const totalParametros = await parametroRepo.count();
  if (totalParametros === 0) {
    for (const p of PARAMETROS_ZOOTECNICOS) {
      await parametroRepo.save(parametroRepo.create(p as any));
    }
    console.log(`  [CRIADO] ${PARAMETROS_ZOOTECNICOS.length} parâmetros inseridos`);
  } else {
    console.log(`  [OK]     ${totalParametros} parâmetros já existem`);
  }

  // 3. Tenants
  console.log('\n── Tenants ─────────────────────────────────');
  const tenantMap: Record<string, Tenant> = {};

  for (const t of TENANTS_SEED) {
    const plano = await planoRepo.findOneByOrFail({ nome: t.planoNome });
    let tenant = await tenantRepo.findOneBy({ nomeFazenda: t.nomeFazenda });

    if (!tenant) {
      tenant = await tenantRepo.save(
        tenantRepo.create({
          nomeFazenda: t.nomeFazenda,
          planoId: plano.id,
          statusConta: StatusConta.ATIVA,
          regiaoCotacao: t.regiaoCotacao,
        }),
      );
      console.log(`  [CRIADO] ${t.nomeFazenda} → plano ${t.planoNome}`);
    } else {
      console.log(`  [OK]     ${t.nomeFazenda} já existe`);
    }

    tenantMap[t.nomeFazenda] = tenant;
  }

  // 4. Usuários de tenant
  console.log('\n── Usuários de Tenant ──────────────────────');
  for (const u of USUARIOS_SEED) {
    const existe = await usuarioRepo.findOneBy({ email: u.email });
    if (!existe) {
      const senhaHash = await bcrypt.hash(u.senha, SALT_ROUNDS);
      await usuarioRepo.save(
        usuarioRepo.create({
          tenantId: tenantMap[u.tenantFazenda].id,
          nome: u.nome,
          email: u.email,
          senhaHash,
          papel: u.papel,
        }),
      );
      console.log(`  [CRIADO] ${u.email}  [${u.papel}]`);
    } else {
      console.log(`  [OK]     ${u.email} já existe`);
    }
  }

  // 5. Super Admin UA
  console.log('\n── Super Admin (UA) ────────────────────────');
  const adminExiste = await adminRepo.findOneBy({ email: ADMIN_SEED.email });
  if (!adminExiste) {
    const senhaHash = await bcrypt.hash(ADMIN_SEED.senha, SALT_ROUNDS);
    await adminRepo.save(
      adminRepo.create({ nome: ADMIN_SEED.nome, email: ADMIN_SEED.email, senhaHash }),
    );
    console.log(`  [CRIADO] ${ADMIN_SEED.email}  [UA]`);
  } else {
    console.log(`  [OK]     ${ADMIN_SEED.email} já existe`);
  }

  // ── Dados de Demonstração (Fazenda Premium) ────────────────────────────────

  const tenantPremium = tenantMap['Fazenda Premium'];

  // 6. Pastos
  console.log('\n── Pastos (Fazenda Premium) ────────────────');
  const pastoIds: string[] = [];
  for (const p of PASTOS_DEMO) {
    let lote = await loteRepo.findOneBy({ tenantId: tenantPremium.id, nome: p.nome });
    if (!lote) {
      lote = await loteRepo.save(
        loteRepo.create({
          tenantId: tenantPremium.id,
          nome: p.nome,
          capacidade: p.capacidade,
          areaHectares: p.areaHectares,
          diasDescanso: p.diasDescanso,
          metodoCriacao: p.metodoCriacao,
        }),
      );
      console.log(`  [CRIADO] ${p.nome}`);
    } else {
      console.log(`  [OK]     ${p.nome} já existe`);
    }
    pastoIds.push(lote.id);
  }

  // 7. Insumos
  console.log('\n── Insumos (Fazenda Premium) ───────────────');
  for (const ins of INSUMOS_DEMO) {
    const existe = await insumoRepo.findOneBy({ tenantId: tenantPremium.id, nome: ins.nome });
    if (!existe) {
      await insumoRepo.save(
        insumoRepo.create({
          tenantId: tenantPremium.id,
          nome: ins.nome,
          tipo: ins.tipo,
          unidade: ins.unidade,
          quantidadeAtual: ins.quantidadeAtual,
          custoUnitario: ins.custoUnitario,
          nivelMinimo: ins.nivelMinimo,
          validade: ins.validade ? new Date(ins.validade) : null,
        }),
      );
      console.log(`  [CRIADO] ${ins.nome}`);
    } else {
      console.log(`  [OK]     ${ins.nome} já existe`);
    }
  }

  // 8. Bovinos + Pesagens
  console.log('\n── Bovinos + Pesagens (Fazenda Premium) ────');
  for (const b of BOVINOS_DEMO) {
    const existe = await bovinoRepo.findOneBy({ tenantId: tenantPremium.id, brinco: b.brinco });
    if (!existe) {
      const loteId = b.pastoIdx >= 0 ? pastoIds[b.pastoIdx] : null;
      const bovino = await bovinoRepo.save(
        bovinoRepo.create({
          tenantId: tenantPremium.id,
          brinco: b.brinco,
          raca: b.raca,
          sexo: b.sexo,
          dataNascimento: new Date(b.dataNascimento),
          dataEntrada: new Date(b.dataNascimento),
          pesoEntrada: b.pesoEntrada,
          loteId,
          status: StatusBovino.ATIVO,
          statusSaude: StatusSaudeBovino.SAUDAVEL,
          custoAcumuladoNutricao: b.custoAcumulado,
        }),
      );

      // Pesagens ordenadas do mais antigo para o mais recente
      const pesagensOrdenadas = [...b.pesagens].sort((a, z) => z.daysAgo - a.daysAgo);
      for (const p of pesagensOrdenadas) {
        const dataPesagem = new Date();
        dataPesagem.setDate(dataPesagem.getDate() - p.daysAgo);
        await pesagemRepo.save(
          pesagemRepo.create({
            tenantId: tenantPremium.id,
            bovinoId: bovino.id,
            peso: p.peso,
            dataPesagem,
            statusSincronizacao: 'SYNCED',
          }),
        );
      }

      // Atualiza statusOcupacao do lote se necessário
      if (loteId) {
        const contagem = await bovinoRepo.count({ where: { loteId, tenantId: tenantPremium.id, status: StatusBovino.ATIVO } });
        const lote = await loteRepo.findOneBy({ id: loteId });
        if (lote) {
          lote.statusOcupacao = contagem >= lote.capacidade ? StatusOcupacao.SUPERLOTADO : StatusOcupacao.NORMAL;
          await loteRepo.save(lote);
        }
      }

      console.log(`  [CRIADO] ${b.brinco} (${b.raca}, ${b.sexo}) — ${b.pesagens.length} pesagens`);
    } else {
      console.log(`  [OK]     ${b.brinco} já existe`);
    }
  }

  await AppDataSource.destroy();

  console.log('\n════════════════════════════════════════════');
  console.log('✔  Seed concluído! Credenciais de teste:\n');
  console.log('  Rota: POST /api/auth/login\n');
  console.log('  ┌──────────────────┬────────────────────────────────┬──────────────────┐');
  console.log('  │ Tipo             │ Email                          │ Senha            │');
  console.log('  ├──────────────────┼────────────────────────────────┼──────────────────┤');
  console.log('  │ Comum   (50 bov) │ comum@fazendademo.com          │ comum123         │');
  console.log('  │ Premium (ilim.)  │ premium@fazendademo.com        │ premium123       │');
  console.log('  │ Empresarial      │ empresarial@fazendademo.com    │ empresarial123   │');
  console.log('  │ Especialista     │ especialista@fazendademo.com   │ espec123         │');
  console.log('  └──────────────────┴────────────────────────────────┴──────────────────┘');
  console.log('\n  Rota: POST /api/auth/admin/login\n');
  console.log('  ┌──────────────────┬────────────────────────────────┬──────────────────┐');
  console.log('  │ Super Admin (UA) │ superadmin@sysbovi.com         │ superadmin123    │');
  console.log('  └──────────────────┴────────────────────────────────┴──────────────────┘');
  console.log('\n  Dados de demonstração (Fazenda Premium):');
  console.log('    • 3 pastos cadastrados');
  console.log('    • 5 insumos (2 em alerta de estoque)');
  console.log('    • 12 bovinos com histórico de pesagens\n');
  console.log('════════════════════════════════════════════\n');
}

seed().catch((err) => {
  console.error('\n✖  Erro no seed:', err.message ?? err);
  process.exit(1);
});
