import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncKnowledgeChunk, serializePlanilha } from "@/lib/knowledge-sync";
import type { Prisma } from "@/generated/prisma/client";
import type { Planilha } from "@/lib/types";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const trash = new URL(request.url).searchParams.get("trash") === "1";

  const planilhas = await prisma.planilha.findMany({
    where: { userId, deletedAt: trash ? { not: null } : null },
    orderBy: trash ? { deletedAt: "desc" } : { createdAt: "desc" },
  });
  return NextResponse.json(
    planilhas.map((p) => ({
      ...p,
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

  const created = await prisma.planilha.create({
    data: {
      id: body.id,
      userId,
      nome: body.nome,
      empresaId: body.empresaId,
      unidadeId: body.unidadeId,
      assunto: body.assunto,
      categoriaIds: body.categoriaIds,
      atividadeId: body.atividadeId,
      conteudo: (body.conteudo ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  serializePlanilha(created)
    .then((content) => syncKnowledgeChunk(userId, "planilha", created.id, content))
    .catch((error) => console.error("Falha ao indexar planilha", error));

  return NextResponse.json(created, { status: 201 });
}
