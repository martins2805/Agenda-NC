import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncKnowledgeChunk, serializeRegistro } from "@/lib/knowledge-sync";

const include = { tabs: true };

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const owned = await prisma.registro.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const restored = await prisma.registro.update({
    where: { id },
    data: { deletedAt: null },
    include,
  });

  serializeRegistro(restored)
    .then((content) => syncKnowledgeChunk(userId, "registro", restored.id, content))
    .catch((error) => console.error("Falha ao reindexar registro restaurado", error));

  return NextResponse.json({
    ...restored,
    tabs: restored.tabs.sort((a, b) => a.ordem - b.ordem),
  });
}
