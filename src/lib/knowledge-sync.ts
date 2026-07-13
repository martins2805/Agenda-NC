import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/gemini";
import { atividadeFromDb } from "@/lib/atividade-mapper";
import type {
  Atividade as DbAtividade,
  Proposta as DbProposta,
  ChecklistItem as DbChecklistItem,
  Registro as DbRegistro,
  RegistroTab as DbRegistroTab,
  Planilha as DbPlanilha,
} from "@/generated/prisma/client";

export async function syncKnowledgeChunk(
  userId: string,
  sourceType: string,
  sourceId: string,
  content: string
) {
  try {
    const trimmed = content.trim();
    if (!trimmed) {
      await deleteKnowledgeChunk(userId, sourceType, sourceId);
      return;
    }
    const embedding = await embedText(trimmed);
    await prisma.knowledgeChunk.upsert({
      where: { userId_sourceType_sourceId: { userId, sourceType, sourceId } },
      create: { userId, sourceType, sourceId, content: trimmed, embedding },
      update: { content: trimmed, embedding },
    });
  } catch (error) {
    console.error(`Falha ao sincronizar embedding (${sourceType}/${sourceId})`, error);
  }
}

export async function deleteKnowledgeChunk(
  userId: string,
  sourceType: string,
  sourceId: string
) {
  try {
    await prisma.knowledgeChunk.deleteMany({ where: { userId, sourceType, sourceId } });
  } catch (error) {
    console.error(`Falha ao remover embedding (${sourceType}/${sourceId})`, error);
  }
}

async function lookupNames(
  userId: string,
  ids: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const clean = [...new Set(ids.filter((id): id is string => !!id))];
  if (clean.length === 0) return new Map();
  const items = await prisma.lookupItem.findMany({ where: { userId, id: { in: clean } } });
  return new Map(items.map((i) => [i.id, i.name]));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

type FullDbAtividade = DbAtividade & {
  propostas: DbProposta[];
  checklist: DbChecklistItem[];
};

export async function serializeAtividade(raw: FullDbAtividade): Promise<string> {
  const a = atividadeFromDb(raw);
  const ids = [
    a.empresaId,
    a.unidadeId,
    ...a.tipoAtividadeIds,
    ...a.propostas.flatMap((p) => [
      ...p.servicoProdutoIds,
      ...p.escopoIds,
      ...p.amostragemIds,
    ]),
  ];
  const names = await lookupNames(raw.userId, ids);
  const name = (id: string | null) => (id ? names.get(id) ?? "" : "");

  const lines = [
    `Atividade`,
    `id: ${a.id}`,
    `Empresa: ${name(a.empresaId)}`,
    `Unidade: ${name(a.unidadeId)}`,
    `Assunto: ${a.assunto}`,
    `Tipos: ${a.tipoAtividadeIds.map(name).filter(Boolean).join(", ")}`,
    `Contato: ${a.contato}`,
    `Prazo: ${a.prazo ?? ""}`,
    `Status: ${a.status}`,
    `Prioridade: ${a.prioridade}`,
    `Descrição: ${stripHtml(a.descricao)}`,
  ];

  if (a.alinhamentos) lines.push(`Alinhamentos: ${stripHtml(a.alinhamentos)}`);
  if (a.emailConteudo) lines.push(`E-mail: ${a.emailConteudo}`);
  if (a.oportunidadeTexto) lines.push(`Oportunidade: ${a.oportunidadeTexto}`);

  if (a.checklist.length > 0) {
    lines.push(
      `Checklist: ${a.checklist
        .map(
          (c) =>
            `${c.concluido ? "[x]" : "[ ]"} ${c.texto}${c.prazo ? ` (prazo: ${c.prazo})` : ""}`
        )
        .join("; ")}`
    );
  }

  a.propostas.forEach((p) => {
    lines.push(
      `Proposta ${p.numero} (${p.tipo ?? "tipo não definido"}): serviços=${p.servicoProdutoIds
        .map(name)
        .filter(Boolean)
        .join(", ")}; detalhe=${p.detalhe}; escopo=${p.escopoIds
        .map(name)
        .filter(Boolean)
        .join(", ")}; amostragem=${p.amostragemIds
        .map(name)
        .filter(Boolean)
        .join(", ")}; quantidade=${p.quantidade ?? ""}; valorUnitario=${
        p.valorUnitario ?? ""
      }; valorTotal=${p.valorTotal ?? ""}; observação=${p.observacao}; statusNegociacao=${
        p.statusNegociacao ?? ""
      }`
    );
  });

  return lines.join("\n");
}

type FullDbRegistro = DbRegistro & { tabs: DbRegistroTab[] };

export async function serializeRegistro(r: FullDbRegistro): Promise<string> {
  const ids = [r.empresaId, r.unidadeId, ...r.categoriaIds];
  const names = await lookupNames(r.userId, ids);
  const name = (id: string | null) => (id ? names.get(id) ?? "" : "");

  const lines = [
    `Registro`,
    `id: ${r.id}`,
    `Empresa: ${name(r.empresaId)}`,
    `Unidade: ${name(r.unidadeId)}`,
    `Assunto: ${r.assunto}`,
    `Contato: ${r.contato}`,
    `Categorias: ${r.categoriaIds.map(name).filter(Boolean).join(", ")}`,
  ];

  r.tabs.forEach((t) => {
    lines.push(`Aba "${t.titulo}": ${stripHtml(t.conteudo)}`);
  });

  return lines.join("\n");
}

export async function serializePlanilha(p: DbPlanilha): Promise<string> {
  const ids = [p.empresaId, p.unidadeId, ...p.categoriaIds];
  const names = await lookupNames(p.userId, ids);
  const name = (id: string | null) => (id ? names.get(id) ?? "" : "");

  return [
    `Planilha: ${p.nome}`,
    `id: ${p.id}`,
    `Empresa: ${name(p.empresaId)}`,
    `Unidade: ${name(p.unidadeId)}`,
    `Assunto: ${p.assunto}`,
    `Categorias: ${p.categoriaIds.map(name).filter(Boolean).join(", ")}`,
  ].join("\n");
}
