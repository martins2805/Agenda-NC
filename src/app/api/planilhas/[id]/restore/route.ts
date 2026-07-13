import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncKnowledgeChunk, serializePlanilha } from "@/lib/knowledge-sync";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const owned = await prisma.planilha.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const restored = await prisma.planilha.update({
    where: { id },
    data: { deletedAt: null },
  });

  serializePlanilha(restored)
    .then((content) => syncKnowledgeChunk(userId, "planilha", restored.id, content))
    .catch((error) => console.error("Falha ao reindexar planilha restaurada", error));

  return NextResponse.json(restored);
}
