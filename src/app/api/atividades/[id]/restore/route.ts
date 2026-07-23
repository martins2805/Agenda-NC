import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { atividadeFromDb } from "@/lib/atividade-mapper";
import { syncKnowledgeChunk, serializeAtividade } from "@/lib/knowledge-sync";

const include = { propostas: true, checklist: true, links: true, anexos: true };

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const owned = await prisma.atividade.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const restored = await prisma.atividade.update({
    where: { id },
    data: { deletedAt: null },
    include,
  });

  serializeAtividade(restored)
    .then((content) => syncKnowledgeChunk(userId, "atividade", restored.id, content))
    .catch((error) => console.error("Falha ao reindexar atividade restaurada", error));

  return NextResponse.json(atividadeFromDb(restored));
}
