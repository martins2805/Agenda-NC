import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { LOOKUP_SEED_DATA } from "../src/lib/lookup-seed-data";
import { statusToDb, prioridadeToDb } from "../src/lib/atividade-mapper";
import { criarVinculo } from "../src/lib/vinculos";
import type { StatusConclusao, Prioridade } from "../src/lib/types";

// Seed de desenvolvimento (Sprint 1). Idempotente: só toca em linhas cujo id
// começa com "seed-" — nunca mexe em dados reais do usuário, mesmo rodando
// contra a mesma conta várias vezes.
//
// Uso: npm run db:seed
// Escala (benchmark de filtro, critério de aceite S1): npm run db:seed -- --scale=5000

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const scaleArg = process.argv.find((a) => a.startsWith("--scale="));
const SCALE = scaleArg ? Number(scaleArg.split("=")[1]) : 0;

const EMPRESAS = [
  { nome: "Ius Natura", unidades: ["Matriz SP", "Filial RJ"] },
  { nome: "Grupo Weex", unidades: ["Sede", "Unidade Norte"] },
  { nome: "Onegreen Ambiental", unidades: ["Central"] },
  { nome: "Comercial Del Rio", unidades: ["Loja 1", "Loja 2", "CD"] },
  { nome: "Indústrias Aral", unidades: ["Fábrica"] },
];

const STATUS_POOL: StatusConclusao[] = [
  "Pendente",
  "Aguardando retorno interno",
  "Aguardando retorno cliente",
  "Concluído",
];
const PRIORIDADE_POOL: Prioridade[] = ["Urgente", "Importante", "Médio", "Baixo"];
const STATUS_NEGOCIACAO_POOL = ["em_andamento", "fup", "aceite", "na"] as const;

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const email = process.env.ADMIN_EMAIL ?? process.env.SEED_USER_EMAIL;
  const password = process.env.ADMIN_PASSWORD ?? process.env.SEED_USER_PASSWORD;
  if (!email || !password) {
    console.warn(
      "AVISO: ADMIN_EMAIL/ADMIN_PASSWORD (ou SEED_USER_EMAIL/SEED_USER_PASSWORD) não definidos. " +
        "Usando conta de seed padrão seed@agenda-nc.local — pode não ser a conta com que você faz login."
    );
  }
  const seedEmail = email ?? "seed@agenda-nc.local";
  const seedPassword = password ?? "seed12345";

  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
      email: seedEmail,
      passwordHash: await bcrypt.hash(seedPassword, 10),
      role: "ADMIN",
    },
  });
  const userId = user.id;
  console.log(`Seed rodando para usuário ${seedEmail} (${userId})`);

  // 1) Limpeza idempotente de dados de seed anteriores (só ids "seed-*")
  await prisma.vinculo.deleteMany({
    where: { userId, OR: [{ origemId: { startsWith: "seed-" } }, { destinoId: { startsWith: "seed-" } }] },
  });
  await prisma.atividade.deleteMany({ where: { userId, id: { startsWith: "seed-" } } });
  await prisma.atividadeGeral.deleteMany({ where: { userId, id: { startsWith: "seed-" } } });
  await prisma.registro.deleteMany({ where: { userId, id: { startsWith: "seed-" } } });
  await prisma.planilha.deleteMany({ where: { userId, id: { startsWith: "seed-" } } });

  // 2) Catálogos: empresa/unidade (não vêm de LOOKUP_SEED_DATA) + os demais kinds
  const empresaIds: string[] = [];
  const unidadeIdsPorEmpresa: string[][] = [];
  for (const emp of EMPRESAS) {
    let item = await prisma.lookupItem.findFirst({ where: { userId, kind: "empresa", name: emp.nome } });
    if (!item) item = await prisma.lookupItem.create({ data: { userId, kind: "empresa", name: emp.nome } });
    empresaIds.push(item.id);

    const unidadeIds: string[] = [];
    for (const nomeUnidade of emp.unidades) {
      let u = await prisma.lookupItem.findFirst({
        where: { userId, kind: "unidade", name: nomeUnidade, empresaId: item.id },
      });
      if (!u)
        u = await prisma.lookupItem.create({
          data: { userId, kind: "unidade", name: nomeUnidade, empresaId: item.id },
        });
      unidadeIds.push(u.id);
    }
    unidadeIdsPorEmpresa.push(unidadeIds);
  }

  const catalogIds: Record<string, string[]> = {};
  for (const { kind, name } of LOOKUP_SEED_DATA) {
    let item = await prisma.lookupItem.findFirst({ where: { userId, kind, name } });
    if (!item) item = await prisma.lookupItem.create({ data: { userId, kind, name } });
    (catalogIds[kind] ??= []).push(item.id);
  }

  const tipoAtividadeIds = catalogIds["tipoAtividade"] ?? [];
  const servicoProdutoIds = catalogIds["servicoProduto"] ?? [];
  const escopoIds = catalogIds["escopo"] ?? [];
  const amostragemIds = catalogIds["amostragem"] ?? [];
  const categoriaRegistroIds = catalogIds["categoriaRegistro"] ?? [];
  const categoriaPlanilhaIds = catalogIds["categoriaPlanilha"] ?? [];
  const tipoAtividadeGeralIds = catalogIds["tipoAtividadeGeral"] ?? [];
  const setorInternoIds = catalogIds["setorInterno"] ?? [];

  const tipoProposta = tipoAtividadeIds[0]; // "Proposta" é a primeira entrada em LOOKUP_SEED_DATA

  // 3) Atividades. A primeira é determinística — cobre o critério de aceite
  // "criar atividade com 2 tipos e 3 itens de proposta via seed".
  const ASSUNTOS = [
    "Renovação de contrato",
    "Levantamento de indicadores",
    "Auditoria interna anual",
    "Implantação de módulo NC",
    "Alinhamento de escopo",
    "Follow-up de proposta",
    "Treinamento de equipe",
    "Revisão de procedimento",
    "Cópia de CAL",
    "Prospecção de novo cliente",
  ];

  function propostaData(numero: number) {
    const valorUnitario = 500 + numero * 137;
    const quantidade = 1 + (numero % 3);
    return {
      id: `seed-proposta-${numero}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      numero,
      servicoProdutoIds: [pick(servicoProdutoIds, numero)],
      escopoIds: [pick(escopoIds, numero)],
      amostragemIds: [pick(amostragemIds, numero)],
      quantidade,
      valorUnitario,
      valorTotal: valorUnitario * quantidade,
      tipo: numero % 2 === 0 ? "MRR" : "PS",
      detalhe: `Item de proposta seedado #${numero}`,
      observacao: "",
      prazoInicio: daysFromNow(-10 + numero),
      prazoFim: daysFromNow(20 + numero),
      statusNegociacao: pick([...STATUS_NEGOCIACAO_POOL], numero),
    };
  }

  const totalAtividades = Math.max(45, SCALE);
  const registroIds: string[] = [];
  const planilhaIds: string[] = [];
  const atividadeIdsCriadas: string[] = [];

  for (let i = 0; i < totalAtividades; i++) {
    const id = i === 0 ? "seed-atividade-verificacao" : `seed-atividade-${i}`;
    const empresaIdx = i % EMPRESAS.length;
    const empresaId = empresaIds[empresaIdx];
    const unidadeId = pick(unidadeIdsPorEmpresa[empresaIdx], i);
    const isVerificacao = i === 0;
    const temProposta = isVerificacao || i % 3 === 0;

    const tipos = isVerificacao
      ? [tipoProposta, pick(tipoAtividadeIds, 1)]
      : temProposta
        ? [tipoProposta]
        : [pick(tipoAtividadeIds, i)];

    const status = pick(STATUS_POOL, i);
    const prioridade = pick(PRIORIDADE_POOL, i);
    // varia prazo: vencida, hoje, próximos dias, sem prazo
    const prazo = i % 7 === 0 ? null : daysFromNow([-15, -3, 0, 5, 20, 45][i % 6]);

    const numPropostas = isVerificacao ? 3 : temProposta ? 1 + (i % 2) : 0;
    const numChecklist = i % 4;

    await prisma.atividade.create({
      data: {
        id,
        userId,
        empresaId,
        unidadeId,
        assunto: isVerificacao ? "Atividade seed de verificação (2 tipos + 3 propostas)" : pick(ASSUNTOS, i),
        tipoAtividadeIds: tipos,
        contato: "",
        prazo,
        status: statusToDb(status),
        prioridade: prioridadeToDb(prioridade),
        propostas: temProposta ? { create: Array.from({ length: numPropostas }, (_, k) => propostaData(k + 1)) } : undefined,
        checklist: {
          create: Array.from({ length: numChecklist }, (_, k) => ({
            id: `${id}-checklist-${k}`,
            texto: `Passo ${k + 1}`,
            concluido: k === 0 && i % 2 === 0,
            ordem: k,
            prazo: k % 2 === 0 ? daysFromNow(3 + k) : null,
          })),
        },
      },
    });
    atividadeIdsCriadas.push(id);
  }

  // 4) AtividadeGeral (Execuções), Registros e Planilhas — volume menor,
  // só o suficiente para exercitar prazo_unificado, checklist e vínculo.
  for (let i = 0; i < 8; i++) {
    const empresaIdx = i % EMPRESAS.length;
    await prisma.atividadeGeral.create({
      data: {
        id: `seed-geral-${i}`,
        userId,
        empresaId: empresaIds[empresaIdx],
        unidadeId: pick(unidadeIdsPorEmpresa[empresaIdx], i),
        tipoIds: [pick(tipoAtividadeGeralIds, i)],
        assunto: `Execução interna #${i + 1}`,
        prazo: i % 3 === 0 ? null : daysFromNow([-5, 2, 10][i % 3]),
        status: pick(["Pendente", "Em andamento", "Concluído"], i),
        prioridade: prioridadeToDb(pick(PRIORIDADE_POOL, i)),
        setorIds: [pick(setorInternoIds, i)],
        checklist: {
          create: Array.from({ length: i % 3 }, (_, k) => ({
            id: `seed-geral-${i}-checklist-${k}`,
            texto: `Item ${k + 1}`,
            ordem: k,
            prazo: k === 0 ? daysFromNow(4) : null,
          })),
        },
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const empresaIdx = i % EMPRESAS.length;
    const id = `seed-registro-${i}`;
    await prisma.registro.create({
      data: {
        id,
        userId,
        nome: `Registro seed ${i + 1}`,
        empresaId: empresaIds[empresaIdx],
        unidadeId: pick(unidadeIdsPorEmpresa[empresaIdx], i),
        assunto: pick(ASSUNTOS, i),
        categoriaIds: [pick(categoriaRegistroIds, i)],
        tabs: { create: [{ id: `${id}-tab-0`, titulo: "Principal", conteudo: "<p>Conteúdo de exemplo.</p>", ordem: 0 }] },
      },
    });
    registroIds.push(id);
  }

  for (let i = 0; i < 6; i++) {
    const empresaIdx = i % EMPRESAS.length;
    const id = `seed-planilha-${i}`;
    await prisma.planilha.create({
      data: {
        id,
        userId,
        nome: `Planilha seed ${i + 1}`,
        empresaId: empresaIds[empresaIdx],
        unidadeId: pick(unidadeIdsPorEmpresa[empresaIdx], i),
        assunto: pick(ASSUNTOS, i),
        categoriaIds: [pick(categoriaPlanilhaIds, i)],
      },
    });
    planilhaIds.push(id);
  }

  // 5) Vínculos — via src/lib/vinculos.ts, o mesmo caminho usado pelas rotas
  // de API. O primeiro registro fica vinculado a 2 atividades (critério de
  // aceite: "vincular o mesmo registro a 2 atividades: aparece nas duas,
  // existe uma vez só").
  await criarVinculo(prisma, userId, { tipo: "registro", id: registroIds[0] }, { tipo: "atividade", id: atividadeIdsCriadas[0] });
  await criarVinculo(prisma, userId, { tipo: "registro", id: registroIds[0] }, { tipo: "atividade", id: atividadeIdsCriadas[1] });
  for (let i = 1; i < registroIds.length; i++) {
    await criarVinculo(prisma, userId, { tipo: "registro", id: registroIds[i] }, { tipo: "atividade", id: atividadeIdsCriadas[i % atividadeIdsCriadas.length] });
  }
  for (let i = 0; i < planilhaIds.length; i++) {
    await criarVinculo(prisma, userId, { tipo: "planilha", id: planilhaIds[i] }, { tipo: "atividade", id: atividadeIdsCriadas[i % atividadeIdsCriadas.length] });
  }

  console.log(
    `Seed concluído: ${totalAtividades} atividades, 8 execuções, ${registroIds.length} registros, ${planilhaIds.length} planilhas.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
