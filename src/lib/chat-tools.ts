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

const include = { propostas: true, checklist: true };

async function criarAtividade(args: Record<string, unknown>) {
  const empresaId = args.empresa
    ? await resolveOrCreateLookup("empresa", String(args.empresa))
    : null;
  const unidadeId = args.unidade
    ? await resolveOrCreateLookup("unidade", String(args.unidade))
    : null;
  const assuntoId = args.assunto
    ? await resolveOrCreateLookup("assunto", String(args.assunto))
    : null;

  const created = await prisma.atividade.create({
    data: {
      id: crypto.randomUUID(),
      empresaId,
      unidadeId,
      assuntoId,
      contato: typeof args.contato === "string" ? args.contato : "",
      prazo: typeof args.prazo === "string" && args.prazo ? new Date(args.prazo) : null,
      descricao: typeof args.descricao === "string" ? args.descricao : "",
      status: statusToDb((args.status as StatusConclusao) ?? "Pendente"),
      prioridade: prioridadeToDb((args.prioridade as Prioridade) ?? "Médio"),
    },
    include,
  });

  serializeAtividade(created)
    .then((content) => syncKnowledgeChunk("atividade", created.id, content))
    .catch((error) => console.error("Falha ao indexar atividade (chat)", error));

  const a = atividadeFromDb(created);
  return { ok: true, id: a.id, empresa: args.empresa ?? null, status: a.status, prioridade: a.prioridade };
}

async function atualizarAtividade(args: Record<string, unknown>) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const data: Record<string, unknown> = {};
  if (args.empresa !== undefined) data.empresaId = await resolveOrCreateLookup("empresa", String(args.empresa));
  if (args.unidade !== undefined) data.unidadeId = await resolveOrCreateLookup("unidade", String(args.unidade));
  if (args.assunto !== undefined) data.assuntoId = await resolveOrCreateLookup("assunto", String(args.assunto));
  if (args.contato !== undefined) data.contato = String(args.contato);
  if (args.prazo !== undefined) data.prazo = args.prazo ? new Date(String(args.prazo)) : null;
  if (args.descricao !== undefined) data.descricao = String(args.descricao);
  if (args.status !== undefined) data.status = statusToDb(args.status as StatusConclusao);
  if (args.prioridade !== undefined) data.prioridade = prioridadeToDb(args.prioridade as Prioridade);

  try {
    const updated = await prisma.atividade.update({ where: { id }, data, include });
    serializeAtividade(updated)
      .then((content) => syncKnowledgeChunk("atividade", updated.id, content))
      .catch((error) => console.error("Falha ao indexar atividade (chat)", error));
    return { ok: true, id: updated.id };
  } catch {
    return { ok: false, error: `Atividade com id ${id} não encontrada` };
  }
}

async function excluirAtividade(args: Record<string, unknown>) {
  if (args.confirmado !== true) return { ok: false, error: "Exclusão requer confirmação explícita do usuário" };
  const id = String(args.id ?? "");
  try {
    await prisma.atividade.delete({ where: { id } });
    deleteKnowledgeChunk("atividade", id).catch((error) => console.error(error));
    return { ok: true };
  } catch {
    return { ok: false, error: `Atividade com id ${id} não encontrada` };
  }
}

async function criarRegistro(args: Record<string, unknown>) {
  const empresaId = args.empresa ? await resolveOrCreateLookup("empresa", String(args.empresa)) : null;
  const unidadeId = args.unidade ? await resolveOrCreateLookup("unidade", String(args.unidade)) : null;
  const assuntoId = args.assunto ? await resolveOrCreateLookup("assunto", String(args.assunto)) : null;
  const categoriaIds = await resolveOrCreateLookups(
    "categoriaRegistro",
    Array.isArray(args.categorias) ? (args.categorias as string[]) : undefined
  );

  const created = await prisma.registro.create({
    data: {
      id: crypto.randomUUID(),
      empresaId,
      unidadeId,
      assuntoId,
      contato: typeof args.contato === "string" ? args.contato : "",
      categoriaIds,
      tabs: {
        create: [
          {
            id: crypto.randomUUID(),
            titulo: "Aba 1",
            conteudo: typeof args.conteudo === "string" ? `<p>${args.conteudo}</p>` : "",
            ordem: 0,
          },
        ],
      },
    },
    include: { tabs: true },
  });

  serializeRegistro(created)
    .then((content) => syncKnowledgeChunk("registro", created.id, content))
    .catch((error) => console.error("Falha ao indexar registro (chat)", error));

  return { ok: true, id: created.id };
}

async function atualizarRegistro(args: Record<string, unknown>) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const data: Record<string, unknown> = {};
  if (args.empresa !== undefined) data.empresaId = await resolveOrCreateLookup("empresa", String(args.empresa));
  if (args.unidade !== undefined) data.unidadeId = await resolveOrCreateLookup("unidade", String(args.unidade));
  if (args.assunto !== undefined) data.assuntoId = await resolveOrCreateLookup("assunto", String(args.assunto));
  if (args.contato !== undefined) data.contato = String(args.contato);
  if (args.categorias !== undefined)
    data.categoriaIds = await resolveOrCreateLookups("categoriaRegistro", args.categorias as string[]);

  try {
    const updated = await prisma.registro.update({ where: { id }, data, include: { tabs: true } });
    serializeRegistro(updated)
      .then((content) => syncKnowledgeChunk("registro", updated.id, content))
      .catch((error) => console.error("Falha ao indexar registro (chat)", error));
    return { ok: true, id: updated.id };
  } catch {
    return { ok: false, error: `Registro com id ${id} não encontrado` };
  }
}

async function excluirRegistro(args: Record<string, unknown>) {
  if (args.confirmado !== true) return { ok: false, error: "Exclusão requer confirmação explícita do usuário" };
  const id = String(args.id ?? "");
  try {
    await prisma.registro.delete({ where: { id } });
    deleteKnowledgeChunk("registro", id).catch((error) => console.error(error));
    return { ok: true };
  } catch {
    return { ok: false, error: `Registro com id ${id} não encontrado` };
  }
}

async function criarPlanilha(args: Record<string, unknown>) {
  const empresaId = args.empresa ? await resolveOrCreateLookup("empresa", String(args.empresa)) : null;
  const unidadeId = args.unidade ? await resolveOrCreateLookup("unidade", String(args.unidade)) : null;
  const assuntoId = args.assunto ? await resolveOrCreateLookup("assunto", String(args.assunto)) : null;
  const categoriaIds = await resolveOrCreateLookups(
    "categoriaPlanilha",
    Array.isArray(args.categorias) ? (args.categorias as string[]) : undefined
  );

  const created = await prisma.planilha.create({
    data: {
      id: crypto.randomUUID(),
      nome: typeof args.nome === "string" && args.nome ? args.nome : "Nova planilha",
      empresaId,
      unidadeId,
      assuntoId,
      categoriaIds,
    },
  });

  serializePlanilha(created)
    .then((content) => syncKnowledgeChunk("planilha", created.id, content))
    .catch((error) => console.error("Falha ao indexar planilha (chat)", error));

  return { ok: true, id: created.id };
}

async function atualizarPlanilha(args: Record<string, unknown>) {
  const id = String(args.id ?? "");
  if (!id) return { ok: false, error: "id é obrigatório" };

  const data: Record<string, unknown> = {};
  if (args.nome !== undefined) data.nome = String(args.nome);
  if (args.empresa !== undefined) data.empresaId = await resolveOrCreateLookup("empresa", String(args.empresa));
  if (args.unidade !== undefined) data.unidadeId = await resolveOrCreateLookup("unidade", String(args.unidade));
  if (args.assunto !== undefined) data.assuntoId = await resolveOrCreateLookup("assunto", String(args.assunto));
  if (args.categorias !== undefined)
    data.categoriaIds = await resolveOrCreateLookups("categoriaPlanilha", args.categorias as string[]);

  try {
    const updated = await prisma.planilha.update({ where: { id }, data });
    serializePlanilha(updated)
      .then((content) => syncKnowledgeChunk("planilha", updated.id, content))
      .catch((error) => console.error("Falha ao indexar planilha (chat)", error));
    return { ok: true, id: updated.id };
  } catch {
    return { ok: false, error: `Planilha com id ${id} não encontrada` };
  }
}

async function excluirPlanilha(args: Record<string, unknown>) {
  if (args.confirmado !== true) return { ok: false, error: "Exclusão requer confirmação explícita do usuário" };
  const id = String(args.id ?? "");
  try {
    await prisma.planilha.delete({ where: { id } });
    deleteKnowledgeChunk("planilha", id).catch((error) => console.error(error));
    return { ok: true };
  } catch {
    return { ok: false, error: `Planilha com id ${id} não encontrada` };
  }
}

const HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<object>> = {
  criar_atividade: criarAtividade,
  atualizar_atividade: atualizarAtividade,
  excluir_atividade: excluirAtividade,
  criar_registro: criarRegistro,
  atualizar_registro: atualizarRegistro,
  excluir_registro: excluirRegistro,
  criar_planilha: criarPlanilha,
  atualizar_planilha: atualizarPlanilha,
  excluir_planilha: excluirPlanilha,
};

export async function executeTool(name: string, args: Record<string, unknown>): Promise<object> {
  const handler = HANDLERS[name];
  if (!handler) return { ok: false, error: `Ferramenta desconhecida: ${name}` };
  try {
    return await handler(args ?? {});
  } catch (error) {
    console.error(`Falha ao executar ferramenta ${name}`, error);
    return { ok: false, error: "Erro interno ao executar a ação" };
  }
}
