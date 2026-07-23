import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { atividadeFromDb, statusToDb, prioridadeToDb } from "@/lib/atividade-mapper";
import {
  syncKnowledgeChunk,
  deleteKnowledgeChunk,
  serializeAtividade,
} from "@/lib/knowledge-sync";
import type { Atividade, HistoricoEntry } from "@/lib/types";
import { deleteVinculosDe } from "@/lib/vinculos";

const include = { propostas: true, checklist: true, links: true, anexos: true };

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

  // Data de conclusão é derivada no servidor, nunca confiada ao cliente:
  // entra em Concluído -> carimba agora (a menos que já estivesse concluída,
  // aí preserva a data original); sai de Concluído -> limpa.
  const wasConcluida = owned.status === "Concluido";
  const willBeConcluida = body.status === "Concluído";
  const concluidoEm = willBeConcluida ? (wasConcluida ? owned.concluidoEm : new Date()) : null;

  // Histórico (critério de aceite da S6): registra só o que de fato mudou,
  // comparando o estado gravado (owned) com o que está chegando no PATCH.
  const novoStatus = statusToDb(body.status);
  const novaPrioridade = prioridadeToDb(body.prioridade);
  const novoPrazo = body.prazo ? new Date(body.prazo) : null;
  const prazoAnteriorIso = owned.prazo ? owned.prazo.toISOString() : null;
  const prazoNovoIso = novoPrazo ? novoPrazo.toISOString() : null;

  const mudancasHistorico: { campo: HistoricoEntry["campo"]; valorAnterior: string | null; valorNovo: string | null }[] = [];
  if (owned.status !== novoStatus) {
    mudancasHistorico.push({ campo: "status", valorAnterior: owned.status, valorNovo: novoStatus });
  }
  if (prazoAnteriorIso !== prazoNovoIso) {
    mudancasHistorico.push({ campo: "prazo", valorAnterior: prazoAnteriorIso, valorNovo: prazoNovoIso });
  }
  if (owned.prioridade !== novaPrioridade) {
    mudancasHistorico.push({ campo: "prioridade", valorAnterior: owned.prioridade, valorNovo: novaPrioridade });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.proposta.deleteMany({ where: { atividadeId: id } });
    await tx.checklistItem.deleteMany({ where: { atividadeId: id } });
    await tx.link.deleteMany({ where: { atividadeId: id } });

    if (mudancasHistorico.length > 0) {
      await tx.historico.createMany({
        data: mudancasHistorico.map((m) => ({
          id: crypto.randomUUID(),
          userId,
          atividadeId: id,
          ...m,
        })),
      });
    }

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
        concluidoEm,
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
        links: {
          create: body.links.map((l, i) => ({
            id: l.id,
            titulo: l.titulo,
            url: l.url,
            ordem: i,
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
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.atividade.deleteMany({ where: { id, userId } });
      if (deleted.count > 0) await deleteVinculosDe(tx, userId, "atividade", id);
      return deleted;
    });
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
