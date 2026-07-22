import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { atividadeFromDb, statusToDb, prioridadeToDb } from "@/lib/atividade-mapper";
import {
  syncKnowledgeChunk,
  deleteKnowledgeChunk,
  serializeAtividade,
} from "@/lib/knowledge-sync";
import type { Atividade } from "@/lib/types";
import { deleteVinculosDe } from "@/lib/vinculos";

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
        prazo: body.prazo ? new Date(body.prazo) : null,
        prazoFim: body.prazoFim ? new Date(body.prazoFim) : null,
        descricao: body.descricao,
        alinhamentos: body.alinhamentos,
        status: statusToDb(body.status),
        prioridade: prioridadeToDb(body.prioridade),
        propostas: {
          create: body.propostas.map((p) => ({
            id: p.id,
            numero: p.numero,
            servicoProdutoIds: p.servicoProdutoIds,
            escopoIds: p.escopoIds,
            amostragemIds: p.amostragemIds,
            quantidade: p.quantidade,
            valorUnitario: p.valorUnitario,
            valorTotal: p.valorTotal,
            tipo: p.tipo,
            detalhe: p.detalhe,
            observacao: p.observacao,
            prazoInicio: p.prazoInicio ? new Date(p.prazoInicio) : null,
            prazoFim: p.prazoFim ? new Date(p.prazoFim) : null,
            statusNegociacao: p.statusNegociacao,
          })),
        },
        checklist: {
          create: body.checklist.map((c, i) => ({
            id: c.id,
            texto: c.texto,
            concluido: c.concluido,
            parentId: c.parentId ?? null,
            ordem: i,
            prazo: c.prazo ? new Date(c.prazo) : null,
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.atividade.deleteMany({ where: { id, userId } });
    if (deleted.count > 0) await deleteVinculosDe(tx, userId, "atividade", id);
    return deleted;
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  deleteKnowledgeChunk(userId, "atividade", id).catch((error) =>
    console.error("Falha ao remover indexação", error)
  );
  return NextResponse.json({ ok: true });
}
