import { prisma } from "@/lib/prisma";
import { resolveOrCreateLookup, resolveOrCreateLookups } from "@/lib/lookup-resolve";
import { statusToDb, prioridadeToDb, atividadeFromDb } from "@/lib/atividade-mapper";
import {
  syncKnowledgeChunk,
  deleteKnowledgeChunk,
  serializeAtividade,
  serializeRegistro,
  serializePlanilha,
} from "@/lib/knowledge-sync";
import type { StatusConclusao, Prioridade } from "@/lib/types";

const STATUS_ENUM = ["Pendente", "Aguardando retorno interno", "Aguardando retorno cliente", "Concluído"];
const PRIORIDADE_ENUM = ["Urgente", "Importante", "Médio", "Baixo"];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: "criar_atividade",
        description:
          "Cria uma nova atividade no Agenda NC. Use quando o usuário pedir para registrar/criar/adicionar uma atividade.",
        parameters: {
          type: "object",
          properties: {
            empresa: { type: "string", description: "Nome da empresa (texto livre)" },
            unidade: { type: "string", description: "Nome da unidade (texto livre)" },
            assunto: { type: "string", description: "Assunto da atividade (texto livre)" },
            contato: { type: "string" },
            prazo: { type: "string", description: "Data no formato YYYY-MM-DD" },
            descricao: { type: "string" },
            status: { type: "string", enum: STATUS_ENUM },
            prioridade: { type: "string", enum: PRIORIDADE_ENUM },
          },
        },
      },
      {
        name: "atualizar_atividade",
        description:
          "Atualiza campos de uma atividade existente. Use o id do índice de atividades fornecido no contexto.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Id da atividade (obrigatório)" },
            empresa: { type: "string" },
            unidade: { type: "string" },
            assunto: { type: "string" },
            contato: { type: "string" },
            prazo: { type: "string", description: "Data no formato YYYY-MM-DD" },
            descricao: { type: "string" },
            status: { type: "string", enum: STATUS_ENUM },
            prioridade: { type: "string", enum: PRIORIDADE_ENUM },
          },
          required: ["id"],
        },
      },
      {
        name: "excluir_atividade",
        description:
          "Exclui uma atividade definitivamente. SÓ chame com confirmado=true depois que o usuário confirmar explicitamente, em uma mensagem separada, que quer excluir.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            confirmado: { type: "boolean" },
          },
          required: ["id", "confirmado"],
        },
      },
      {
        name: "criar_registro",
        description:
          "Cria um novo registro (anotação de reunião) no Agenda NC.",
        parameters: {
          type: "object",
          properties: {
            empresa: { type: "string" },
            unidade: { type: "string" },
            assunto: { type: "string" },
            contato: { type: "string" },
            categorias: { type: "array", items: { type: "string" } },
            conteudo: { type: "string", description: "Texto livre do registro" },
          },
        },
      },
      {
        name: "atualizar_registro",
        description: "Atualiza metadados de um registro existente (não edita o conteúdo das abas).",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            empresa: { type: "string" },
            unidade: { type: "string" },
            assunto: { type: "string" },
            contato: { type: "string" },
            categorias: { type: "array", items: { type: "string" } },
          },
          required: ["id"],
        },
      },
      {
        name: "excluir_registro",
        description:
          "Exclui um registro definitivamente. SÓ chame com confirmado=true depois de confirmação explícita do usuário.",
        parameters: {
          type: "object",
          properties: { id: { type: "string" }, confirmado: { type: "boolean" } },
          required: ["id", "confirmado"],
        },
      },
      {
        name: "criar_planilha",
        description: "Cria uma nova planilha (só metadados; conteúdo de células não é editável pelo chat).",
        parameters: {
          type: "object",
          properties: {
            nome: { type: "string" },
            empresa: { type: "string" },
            unidade: { type: "string" },
            assunto: { type: "string" },
            categorias: { type: "array", items: { type: "string" } },
          },
        },
      },
      {
        name: "atualizar_planilha",
        description: "Atualiza metadados de uma planilha existente.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            nome: { type: "string" },
            empresa: { type: "string" },
            unidade: { type: "string" },
            assunto: { type: "string" },
            categorias: { type: "array", items: { type: "string" } },
          },
          required: ["id"],
        },
      },
      {
        name: "excluir_planilha",
        description:
          "Exclui uma planilha definitivamente. SÓ chame com confirmado=true depois de confirmação explícita do usuário.",
        parameters: {
          type: "object",
          properties: { id: { type: "string" }, confirmado: { type: "boolean" } },
          required: ["id", "confirmado"],
        },
      },
    ],
  },
];

const include = { propostas: true, checklist: true, links: true, anexos: true };

const CONFIRMATION_WINDOW_MS = 15 * 60 * 1000;

export interface ToolContext {
  requestMessageId: string;
}

// Deletion is confirmed by the model setting confirmado=true, but that's a
// value the model can assert on its own — it doesn't prove the user actually
// confirmed anything. This enforces that the confirmed call must reference a
// pending request that was registered in an EARLIER chat turn (a different
// chatMessage id), so a single turn can never both request and confirm.
async function guardDeletion(
  userId: string,
  entityType: string,
  entityId: string,
  ctx: ToolContext,
  confirmado: unknown
): Promise<{ proceed: true } | { proceed: false; error: string }> {
  const now = new Date();

  if (confirmado !== true) {
    await prisma.pendingDeletion.upsert({
      where: { userId_entityType_entityId: { userId, entityType, entityId } },
      create: {
        userId,
        entityType,
        entityId,
        requestedInMessageId: ctx.requestMessageId,
        expiresAt: new Date(now.getTime() + CONFIRMATION_WINDOW_MS),
      },
      update: {
        requestedInMessageId: ctx.requestMessageId,
        createdAt: now,
        expiresAt: new Date(now.getTime() + CONFIRMATION_WINDOW_MS),
      },
    });
    return {
      proceed: false,
      error: "Exclusão requer confirmação explícita do usuário em uma mensagem separada",
    };
  }

  const pending = await prisma.pendingDeletion.findUnique({
    where: { userId_entityType_entityId: { userId, entityType, entityId } },
  });

  if (!pending || pending.expiresAt < now) {
    if (pending) await prisma.pendingDeletion.delete({ where: { id: pending.id } }).catch(() => {});
    return {
      proceed: false,
      error: "Nenhuma solicitação de exclusão pendente e válida. Peça a confirmação do usuário novamente antes de excluir.",
    };
  }

  if (pending.requestedInMessageId === ctx.requestMessageId) {
    return {
      proceed: false,
      error: "A confirmação precisa vir em uma mensagem separada do usuário, não na mesma chamada.",
    };
  }

  await prisma.pendingDeletion.delete({ where: { id: pending.id } });
  return { proceed: true };
}

async function criarAtividade(userId: string, args: Record<string, unknown>) {
  const empresaId = args.empresa
    ? await resolveOrCreateLookup(userId, "empresa", String(args.empresa))
    : null;
  const unidadeId = args.unidade
    ? await resolveOrCreateLookup(userId, "unidade", String(args.unidade))
    : null;

  const created = await prisma.atividade.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      empresaId,
      unidadeId,
      assunto: typeof args.assunto === "string" ? args.assunto : "",
      contato: typeof args.contato === "string" ? args.contato : "",
      prazo: typeof args.prazo === "string" && args.prazo ? new Date(args.prazo) : null,
      descricao: typeof args.descricao === "string" ? args.descricao : "",
      status: statusToDb((args.status as StatusConclusao) ?? "Pendente"),
      prioridade: prioridadeToDb((args.prioridade as Prioridade) ?? "Médio"),
    },
    include,
  });

  serializeAtividade(created)
    .then((content) => syncKnowledgeChunk(userId, "atividade", created.id, content))
    .catch((error) => console.error("Falha ao indexar atividade (chat)", error));

  const a = atividadeFromDb(created);
  return { ok: true, id: a.id, empresa: args.empresa ?? null, status: a.status, prioridade: a.prioridade };
}

async function atualizarAtividade(userId: string, args: Record<string, unknown>) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const owned = await prisma.atividade.findFirst({ where: { id, userId } });
  if (!owned) return { ok: false, error: `Atividade com id ${id} não encontrada` };

  const data: Record<string, unknown> = {};
  if (args.empresa !== undefined) data.empresaId = await resolveOrCreateLookup(userId, "empresa", String(args.empresa));
  if (args.unidade !== undefined) data.unidadeId = await resolveOrCreateLookup(userId, "unidade", String(args.unidade));
  if (args.assunto !== undefined) data.assunto = String(args.assunto);
  if (args.contato !== undefined) data.contato = String(args.contato);
  if (args.prazo !== undefined) data.prazo = args.prazo ? new Date(String(args.prazo)) : null;
  if (args.descricao !== undefined) data.descricao = String(args.descricao);
  if (args.status !== undefined) data.status = statusToDb(args.status as StatusConclusao);
  if (args.prioridade !== undefined) data.prioridade = prioridadeToDb(args.prioridade as Prioridade);

  try {
    const updated = await prisma.atividade.update({ where: { id }, data, include });
    serializeAtividade(updated)
      .then((content) => syncKnowledgeChunk(userId, "atividade", updated.id, content))
      .catch((error) => console.error("Falha ao indexar atividade (chat)", error));
    return { ok: true, id: updated.id };
  } catch {
    return { ok: false, error: `Atividade com id ${id} não encontrada` };
  }
}

async function excluirAtividade(userId: string, args: Record<string, unknown>, ctx: ToolContext) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const guard = await guardDeletion(userId, "atividade", id, ctx, args.confirmado);
  if (!guard.proceed) return { ok: false, error: guard.error };

  const result = await prisma.atividade.deleteMany({ where: { id, userId } });
  if (result.count === 0) return { ok: false, error: `Atividade com id ${id} não encontrada` };
  deleteKnowledgeChunk(userId, "atividade", id).catch((error) => console.error(error));
  return { ok: true };
}

async function criarRegistro(userId: string, args: Record<string, unknown>) {
  const empresaId = args.empresa ? await resolveOrCreateLookup(userId, "empresa", String(args.empresa)) : null;
  const unidadeId = args.unidade ? await resolveOrCreateLookup(userId, "unidade", String(args.unidade)) : null;
  const categoriaIds = await resolveOrCreateLookups(
    userId,
    "categoriaRegistro",
    Array.isArray(args.categorias) ? (args.categorias as string[]) : undefined
  );

  const created = await prisma.registro.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      empresaId,
      unidadeId,
      assunto: typeof args.assunto === "string" ? args.assunto : "",
      contato: typeof args.contato === "string" ? args.contato : "",
      categoriaIds,
      tabs: {
        create: [
          {
            id: crypto.randomUUID(),
            titulo: "Aba 1",
            conteudo: typeof args.conteudo === "string" ? `<p>${escapeHtml(args.conteudo)}</p>` : "",
            ordem: 0,
          },
        ],
      },
    },
    include: { tabs: true },
  });

  serializeRegistro(created)
    .then((content) => syncKnowledgeChunk(userId, "registro", created.id, content))
    .catch((error) => console.error("Falha ao indexar registro (chat)", error));

  return { ok: true, id: created.id };
}

async function atualizarRegistro(userId: string, args: Record<string, unknown>) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const owned = await prisma.registro.findFirst({ where: { id, userId } });
  if (!owned) return { ok: false, error: `Registro com id ${id} não encontrado` };

  const data: Record<string, unknown> = {};
  if (args.empresa !== undefined) data.empresaId = await resolveOrCreateLookup(userId, "empresa", String(args.empresa));
  if (args.unidade !== undefined) data.unidadeId = await resolveOrCreateLookup(userId, "unidade", String(args.unidade));
  if (args.assunto !== undefined) data.assunto = String(args.assunto);
  if (args.contato !== undefined) data.contato = String(args.contato);
  if (args.categorias !== undefined)
    data.categoriaIds = await resolveOrCreateLookups(userId, "categoriaRegistro", args.categorias as string[]);

  try {
    const updated = await prisma.registro.update({ where: { id }, data, include: { tabs: true } });
    serializeRegistro(updated)
      .then((content) => syncKnowledgeChunk(userId, "registro", updated.id, content))
      .catch((error) => console.error("Falha ao indexar registro (chat)", error));
    return { ok: true, id: updated.id };
  } catch {
    return { ok: false, error: `Registro com id ${id} não encontrado` };
  }
}

async function excluirRegistro(userId: string, args: Record<string, unknown>, ctx: ToolContext) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const guard = await guardDeletion(userId, "registro", id, ctx, args.confirmado);
  if (!guard.proceed) return { ok: false, error: guard.error };

  const result = await prisma.registro.deleteMany({ where: { id, userId } });
  if (result.count === 0) return { ok: false, error: `Registro com id ${id} não encontrado` };
  deleteKnowledgeChunk(userId, "registro", id).catch((error) => console.error(error));
  return { ok: true };
}

async function criarPlanilha(userId: string, args: Record<string, unknown>) {
  const empresaId = args.empresa ? await resolveOrCreateLookup(userId, "empresa", String(args.empresa)) : null;
  const unidadeId = args.unidade ? await resolveOrCreateLookup(userId, "unidade", String(args.unidade)) : null;
  const categoriaIds = await resolveOrCreateLookups(
    userId,
    "categoriaPlanilha",
    Array.isArray(args.categorias) ? (args.categorias as string[]) : undefined
  );

  const created = await prisma.planilha.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      nome: typeof args.nome === "string" && args.nome ? args.nome : "Nova planilha",
      empresaId,
      unidadeId,
      assunto: typeof args.assunto === "string" ? args.assunto : "",
      categoriaIds,
    },
  });

  serializePlanilha(created)
    .then((content) => syncKnowledgeChunk(userId, "planilha", created.id, content))
    .catch((error) => console.error("Falha ao indexar planilha (chat)", error));

  return { ok: true, id: created.id };
}

async function atualizarPlanilha(userId: string, args: Record<string, unknown>) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const owned = await prisma.planilha.findFirst({ where: { id, userId } });
  if (!owned) return { ok: false, error: `Planilha com id ${id} não encontrada` };

  const data: Record<string, unknown> = {};
  if (args.nome !== undefined) data.nome = String(args.nome);
  if (args.empresa !== undefined) data.empresaId = await resolveOrCreateLookup(userId, "empresa", String(args.empresa));
  if (args.unidade !== undefined) data.unidadeId = await resolveOrCreateLookup(userId, "unidade", String(args.unidade));
  if (args.assunto !== undefined) data.assunto = String(args.assunto);
  if (args.categorias !== undefined)
    data.categoriaIds = await resolveOrCreateLookups(userId, "categoriaPlanilha", args.categorias as string[]);

  try {
    const updated = await prisma.planilha.update({ where: { id }, data });
    serializePlanilha(updated)
      .then((content) => syncKnowledgeChunk(userId, "planilha", updated.id, content))
      .catch((error) => console.error("Falha ao indexar planilha (chat)", error));
    return { ok: true, id: updated.id };
  } catch {
    return { ok: false, error: `Planilha com id ${id} não encontrada` };
  }
}

async function excluirPlanilha(userId: string, args: Record<string, unknown>, ctx: ToolContext) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const guard = await guardDeletion(userId, "planilha", id, ctx, args.confirmado);
  if (!guard.proceed) return { ok: false, error: guard.error };

  const result = await prisma.planilha.deleteMany({ where: { id, userId } });
  if (result.count === 0) return { ok: false, error: `Planilha com id ${id} não encontrada` };
  deleteKnowledgeChunk(userId, "planilha", id).catch((error) => console.error(error));
  return { ok: true };
}

type ToolHandler = (userId: string, args: Record<string, unknown>, ctx: ToolContext) => Promise<object>;

const HANDLERS: Record<string, ToolHandler> = {
  criar_atividade: (userId, args) => criarAtividade(userId, args),
  atualizar_atividade: (userId, args) => atualizarAtividade(userId, args),
  excluir_atividade: excluirAtividade,
  criar_registro: (userId, args) => criarRegistro(userId, args),
  atualizar_registro: (userId, args) => atualizarRegistro(userId, args),
  excluir_registro: excluirRegistro,
  criar_planilha: (userId, args) => criarPlanilha(userId, args),
  atualizar_planilha: (userId, args) => atualizarPlanilha(userId, args),
  excluir_planilha: excluirPlanilha,
};

export async function executeTool(
  userId: string,
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<object> {
  const handler = HANDLERS[name];
  if (!handler) return { ok: false, error: `Ferramenta desconhecida: ${name}` };
  try {
    return await handler(userId, args ?? {}, ctx);
  } catch (error) {
    console.error(`Falha ao executar ferramenta ${name}`, error);
    return { ok: false, error: "Erro interno ao executar a ação" };
  }
}
