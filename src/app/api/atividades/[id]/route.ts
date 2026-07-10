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

const include = { propostas: true, checklist: true };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as Atividade;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.proposta.deleteMany({ where: { atividadeId: id } });
    await tx.checklistItem.deleteMany({ where: { atividadeId: id } });

    return tx.atividade.update({
      where: { id },
      data: {
        empresaId: body.empresaId,
        unidadeId: body.unidadeId,
        assuntoId: body.assuntoId,
        tipoAtividadeIds: body.tipoAtividadeIds,
        emailConteudo: body.emailConteudo,
        oportunidadeTexto: body.oportunidadeTexto,
        contato: body.contato,
        prazo: body.prazo ? new Date(body.prazo) : null,
        descricao: body.descricao,
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
          })),
        },
        checklist: {
          create: body.checklist.map((c, i) => ({
            id: c.id,
            texto: c.texto,
            concluido: c.concluido,
            ordem: i,
          })),
        },
      },
      include,
    });
  });

  serializeAtividade(updated)
    .then((content) => syncKnowledgeChunk("atividade", updated.id, content))
    .catch((error) => console.error("Falha ao indexar atividade", error));

  return NextResponse.json(atividadeFromDb(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.atividade.delete({ where: { id } });
  deleteKnowledgeChunk("atividade", id).catch((error) =>
    console.error("Falha ao remover indexação", error)
  );
  return NextResponse.json({ ok: true });
}
