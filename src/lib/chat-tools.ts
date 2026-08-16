import { prisma } from "@/lib/prisma";
import { resolveOrCreateLookup } from "@/lib/lookup-resolve";
import { statusToDb, prioridadeToDb, atividadeFromDb } from "@/lib/atividade-mapper";
import { syncKnowledgeChunk, deleteKnowledgeChunk, serializeAtividade } from "@/lib/knowledge-sync";
import type { StatusConclusao, Prioridade } from "@/lib/types";

const STATUS_ENUM = ["Pendente", "Aguardando retorno interno", "Aguardando retorno cliente", "Concluído"];
const PRIORIDADE_ENUM = ["Urgente", "Importante", "Médio", "Baixo"];

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

type ToolHandler = (userId: string, args: Record<string, unknown>, ctx: ToolContext) => Promise<object>;

const HANDLERS: Record<string, ToolHandler> = {
  criar_atividade: (userId, args) => criarAtividade(userId, args),
  atualizar_atividade: (userId, args) => atualizarAtividade(userId, args),
  excluir_atividade: excluirAtividade,
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
