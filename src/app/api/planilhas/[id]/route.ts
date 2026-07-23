import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  syncKnowledgeChunk,
  deleteKnowledgeChunk,
  serializePlanilha,
} from "@/lib/knowledge-sync";
import type { Planilha } from "@/lib/types";
import { syncVinculos, deleteVinculosDe, listarVinculados } from "@/lib/vinculos";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;

  const owned = await prisma.planilha.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as Partial<Planilha>;

  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.empresaId !== undefined) data.empresaId = body.empresaId;
  if (body.unidadeId !== undefined) data.unidadeId = body.unidadeId;
  if (body.assunto !== undefined) data.assunto = body.assunto;
  if (body.categoriaIds !== undefined) data.categoriaIds = body.categoriaIds;
  if (body.conteudo !== undefined) data.conteudo = body.conteudo;

  const updated = await prisma.$transaction(async (tx) => {
    const planilha = await tx.planilha.update({ where: { id }, data });
    if (body.atividadeIds !== undefined) {
      await syncVinculos(tx, userId, { tipo: "planilha", id }, "atividade", body.atividadeIds);
    }
    if (body.atividadeGeralIds !== undefined) {
      await syncVinculos(tx, userId, { tipo: "planilha", id }, "atividadeGeral", body.atividadeGeralIds);
    }
    return planilha;
  });

  const atividadeIds = await listarVinculados(prisma, userId, { tipo: "planilha", id }, "atividade");
  const atividadeGeralIds = await listarVinculados(prisma, userId, { tipo: "planilha", id }, "atividadeGeral");

  const metadataChanged =
    body.nome !== undefined ||
    body.empresaId !== undefined ||
    body.unidadeId !== undefined ||
    body.assunto !== undefined ||
    body.categoriaIds !== undefined;

  if (metadataChanged) {
    serializePlanilha(updated)
      .then((content) => syncKnowledgeChunk(userId, "planilha", updated.id, content))
      .catch((error) => console.error("Falha ao indexar planilha", error));
  }

  return NextResponse.json({ ...updated, atividadeIds, atividadeGeralIds });
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
      const deleted = await tx.planilha.deleteMany({ where: { id, userId } });
      if (deleted.count > 0) await deleteVinculosDe(tx, userId, "planilha", id);
      return deleted;
    });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    deleteKnowledgeChunk(userId, "planilha", id).catch((error) =>
      console.error("Falha ao remover indexação", error)
    );
    return NextResponse.json({ ok: true });
  }

  const result = await prisma.planilha.updateMany({
    where: { id, userId },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  deleteKnowledgeChunk(userId, "planilha", id).catch((error) =>
    console.error("Falha ao remover indexação", error)
  );
  return NextResponse.json({ ok: true });
}
