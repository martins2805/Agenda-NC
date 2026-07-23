import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncKnowledgeChunk, serializePlanilha } from "@/lib/knowledge-sync";
import type { Prisma } from "@/generated/prisma/client";
import type { Planilha } from "@/lib/types";
import { syncVinculos, listarVinculadosEmLote } from "@/lib/vinculos";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const trash = new URL(request.url).searchParams.get("trash") === "1";

  const planilhas = await prisma.planilha.findMany({
    where: { userId, deletedAt: trash ? { not: null } : null },
    orderBy: trash ? { deletedAt: "desc" } : { createdAt: "desc" },
  });
  const vinculosPorId = await listarVinculadosEmLote(
    prisma,
    userId,
    "planilha",
    planilhas.map((p) => p.id),
    "atividade"
  );
  const vinculosGeralPorId = await listarVinculadosEmLote(
    prisma,
    userId,
    "planilha",
    planilhas.map((p) => p.id),
    "atividadeGeral"
  );
  return NextResponse.json(
    planilhas.map((p) => ({
      ...p,
      atividadeIds: vinculosPorId.get(p.id) ?? [],
      atividadeGeralIds: vinculosGeralPorId.get(p.id) ?? [],
      createdAt: p.createdAt.toISOString(),
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as Planilha;

  const created = await prisma.$transaction(async (tx) => {
    const planilha = await tx.planilha.create({
      data: {
        id: body.id,
        userId,
        nome: body.nome,
        empresaId: body.empresaId,
        unidadeId: body.unidadeId,
        assunto: body.assunto,
        categoriaIds: body.categoriaIds,
        conteudo: (body.conteudo ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    await syncVinculos(tx, userId, { tipo: "planilha", id: planilha.id }, "atividade", body.atividadeIds ?? []);
    await syncVinculos(tx, userId, { tipo: "planilha", id: planilha.id }, "atividadeGeral", body.atividadeGeralIds ?? []);
    return planilha;
  });

  serializePlanilha(created)
    .then((content) => syncKnowledgeChunk(userId, "planilha", created.id, content))
    .catch((error) => console.error("Falha ao indexar planilha", error));

  return NextResponse.json(
    { ...created, atividadeIds: body.atividadeIds ?? [], atividadeGeralIds: body.atividadeGeralIds ?? [] },
    { status: 201 }
  );
}
