import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncKnowledgeChunk, serializeRegistro } from "@/lib/knowledge-sync";
import { syncVinculos, listarVinculadosEmLote } from "@/lib/vinculos";
import type { Registro } from "@/lib/types";

const include = { tabs: true };

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const trash = new URL(request.url).searchParams.get("trash") === "1";

  const registros = await prisma.registro.findMany({
    where: { userId, deletedAt: trash ? { not: null } : null },
    include,
    orderBy: trash ? { deletedAt: "desc" } : { createdAt: "desc" },
  });
  const vinculosPorId = await listarVinculadosEmLote(
    prisma,
    userId,
    "registro",
    registros.map((r) => r.id),
    "atividade"
  );
  const vinculosGeralPorId = await listarVinculadosEmLote(
    prisma,
    userId,
    "registro",
    registros.map((r) => r.id),
    "atividadeGeral"
  );
  return NextResponse.json(
    registros.map((r) => ({
      ...r,
      tabs: r.tabs.sort((a, b) => a.ordem - b.ordem),
      atividadeIds: vinculosPorId.get(r.id) ?? [],
      atividadeGeralIds: vinculosGeralPorId.get(r.id) ?? [],
      createdAt: r.createdAt.toISOString(),
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as Registro;

  const created = await prisma.$transaction(async (tx) => {
    const registro = await tx.registro.create({
      data: {
        id: body.id,
        userId,
        nome: body.nome,
        empresaId: body.empresaId,
        unidadeId: body.unidadeId,
        contato: body.contato,
        assunto: body.assunto,
        categoriaIds: body.categoriaIds,
        tabs: {
          create: body.tabs.map((t, i) => ({
            id: t.id,
            titulo: t.titulo,
            conteudo: t.conteudo,
            ordem: i,
          })),
        },
      },
      include,
    });
    await syncVinculos(tx, userId, { tipo: "registro", id: registro.id }, "atividade", body.atividadeIds ?? []);
    await syncVinculos(tx, userId, { tipo: "registro", id: registro.id }, "atividadeGeral", body.atividadeGeralIds ?? []);
    return registro;
  });

  serializeRegistro(created)
    .then((content) => syncKnowledgeChunk(userId, "registro", created.id, content))
    .catch((error) => console.error("Falha ao indexar registro", error));

  return NextResponse.json(
    {
      ...created,
      tabs: created.tabs.sort((a, b) => a.ordem - b.ordem),
      atividadeIds: body.atividadeIds ?? [],
      atividadeGeralIds: body.atividadeGeralIds ?? [],
    },
    { status: 201 }
  );
}
