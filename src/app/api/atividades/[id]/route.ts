import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  atividadeFromDb,
  statusToDb,
  prioridadeToDb,
  orderChecklistForInsert,
} from "@/lib/atividade-mapper";
import {
  syncKnowledgeChunk,
  deleteKnowledgeChunk,
  serializeAtividade,
} from "@/lib/knowledge-sync";
import { localInputToUtcDate } from "@/lib/calculations";
import type { Atividade } from "@/lib/types";

const include = { propostas: true, checklist: true };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;

  const owned = await prisma.atividade.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as Atividade;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.proposta.deleteMany({ where: { atividadeId: id } });
    await tx.checklistItem.deleteMany({ where: { atividadeId: id } });

    return tx.atividade.update({
      where: { id },
      data: {
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
  });

  serializeAtividade(updated)
    .then((content) => syncKnowledgeChunk(userId, "atividade", updated.id, content))
    .catch((error) => console.error("Falha ao indexar atividade", error));

  return NextResponse.json(atividadeFromDb(updated));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const permanent = new URL(request.url).searchParams.get("permanent") === "1";

  if (permanent) {
    const result = await prisma.atividade.deleteMany({ where: { id, userId } });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    deleteKnowledgeChunk(userId, "atividade", id).catch((error) =>
      console.error("Falha ao remover indexação", error)
    );
    return NextResponse.json({ ok: true });
  }

  const result = await prisma.atividade.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  deleteKnowledgeChunk(userId, "atividade", id).catch((error) =>
    console.error("Falha ao remover indexação", error)
  );
  return NextResponse.json({ ok: true });
}
