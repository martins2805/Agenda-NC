import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  atividadeFromDb,
  statusToDb,
  prioridadeToDb,
  orderChecklistForInsert,
} from "@/lib/atividade-mapper";
import { syncKnowledgeChunk, serializeAtividade } from "@/lib/knowledge-sync";
import { localInputToUtcDate } from "@/lib/calculations";
import type { Atividade } from "@/lib/types";

const include = { propostas: true, checklist: true };

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const trash = new URL(request.url).searchParams.get("trash") === "1";

  const atividades = await prisma.atividade.findMany({
    where: { userId, deletedAt: trash ? { not: null } : null },
    include,
    orderBy: trash ? { deletedAt: "desc" } : { createdAt: "desc" },
  });
  return NextResponse.json(atividades.map(atividadeFromDb));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as Atividade;

  const created = await prisma.atividade.create({
    data: {
      id: body.id,
      userId,
      empresaId: body.empresaId,
      unidadeId: body.unidadeId,
      assunto: body.assunto,
      tipoAtividadeIds: body.tipoAtividadeIds,
      emailConteudo: body.emailConteudo,
      oportunidadeTexto: body.oportunidadeTexto,
      contato: body.contato,
      prazo: body.prazo ? localInputToUtcDate(body.prazo) : null,
      descricao: body.descricao,
      alinhamentos: body.alinhamentos,
      status: statusToDb(body.status),
      prioridade: prioridadeToDb(body.prioridade),
      propostas: {
        create: body.propostas.map((p) => ({
          id: p.id,
          numero: p.numero,
          tipo: p.tipo,
          servicoProdutoIds: p.servicoProdutoIds,
          detalhe: p.detalhe,
          escopoIds: p.escopoIds,
          amostragemIds: p.amostragemIds,
          quantidade: p.quantidade,
          valorUnitario: p.valorUnitario,
          valorTotal: p.valorTotal,
          observacao: p.observacao,
          prazoInicio: p.prazoInicio ? localInputToUtcDate(p.prazoInicio) : null,
          prazoFim: p.prazoFim ? localInputToUtcDate(p.prazoFim) : null,
          statusNegociacao: p.statusNegociacao,
        })),
      },
      checklist: {
        create: orderChecklistForInsert(
          body.checklist.map((c, i) => ({ ...c, ordem: i }))
        ).map((c) => ({
          id: c.id,
          texto: c.texto,
          concluido: c.concluido,
          ordem: c.ordem,
          prazo: c.prazo ? localInputToUtcDate(c.prazo) : null,
          parentId: c.parentId,
        })),
      },
    },
    include,
  });

  serializeAtividade(created)
    .then((content) => syncKnowledgeChunk(userId, "atividade", created.id, content))
    .catch((error) => console.error("Falha ao indexar atividade", error));

  return NextResponse.json(atividadeFromDb(created), { status: 201 });
}
