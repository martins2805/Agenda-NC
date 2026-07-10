import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncKnowledgeChunk, serializeRegistro } from "@/lib/knowledge-sync";
import type { Registro } from "@/lib/types";

const include = { tabs: true };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const registros = await prisma.registro.findMany({
    include,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    registros.map((r) => ({
      ...r,
      tabs: r.tabs.sort((a, b) => a.ordem - b.ordem),
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Registro;

  const created = await prisma.registro.create({
    data: {
      id: body.id,
      empresaId: body.empresaId,
      unidadeId: body.unidadeId,
      contato: body.contato,
      assuntoId: body.assuntoId,
      categoriaIds: body.categoriaIds,
      atividadeId: body.atividadeId,
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

  serializeRegistro(created)
    .then((content) => syncKnowledgeChunk("registro", created.id, content))
    .catch((error) => console.error("Falha ao indexar registro", error));

  return NextResponse.json(
    { ...created, tabs: created.tabs.sort((a, b) => a.ordem - b.ordem) },
    { status: 201 }
  );
}
