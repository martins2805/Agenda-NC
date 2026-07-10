import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  syncKnowledgeChunk,
  deleteKnowledgeChunk,
  serializePlanilha,
} from "@/lib/knowledge-sync";
import type { Planilha } from "@/lib/types";

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
  if (body.assuntoId !== undefined) data.assuntoId = body.assuntoId;
  if (body.categoriaIds !== undefined) data.categoriaIds = body.categoriaIds;
  if (body.atividadeId !== undefined) data.atividadeId = body.atividadeId;
  if (body.conteudo !== undefined) data.conteudo = body.conteudo;

  const updated = await prisma.planilha.update({ where: { id }, data });

  const metadataChanged =
    body.nome !== undefined ||
    body.empresaId !== undefined ||
    body.unidadeId !== undefined ||
    body.assuntoId !== undefined ||
    body.categoriaIds !== undefined;

  if (metadataChanged) {
    serializePlanilha(updated)
      .then((content) => syncKnowledgeChunk(userId, "planilha", updated.id, content))
      .catch((error) => console.error("Falha ao indexar planilha", error));
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const result = await prisma.planilha.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  deleteKnowledgeChunk(userId, "planilha", id).catch((error) =>
    console.error("Falha ao remover indexação", error)
  );
  return NextResponse.json({ ok: true });
}
