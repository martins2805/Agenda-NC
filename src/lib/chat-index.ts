import { prisma } from "@/lib/prisma";

/**
 * Índice leve de todas as entidades (id + campos identificadores), incluído
 * em todo prompt do chat para que o modelo saiba a que "id" se referir ao
 * chamar as ferramentas de editar/excluir, mesmo quando a busca semântica
 * (RAG) não traz o registro certo para a pergunta atual.
 */
export async function buildEntityIndex(userId: string): Promise<string> {
  const [atividades, lookups] = await Promise.all([
    prisma.atividade.findMany({
      where: { userId },
      select: { id: true, empresaId: true, assunto: true, status: true, prioridade: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.lookupItem.findMany({ where: { userId, active: true } }),
  ]);

  const names = new Map(lookups.map((l) => [l.id, l.name]));
  const name = (id: string | null) => (id ? names.get(id) ?? "?" : "(sem empresa)");

  const lines: string[] = [];

  lines.push("ATIVIDADES:");
  if (atividades.length === 0) lines.push("(nenhuma)");
  atividades.forEach((a) => {
    lines.push(
      `id=${a.id} | ${name(a.empresaId)} | ${a.assunto || "(sem assunto)"} | status=${a.status} | prioridade=${a.prioridade}`
    );
  });

  return lines.join("\n");
}
