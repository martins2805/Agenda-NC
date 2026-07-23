import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { historicoFromDb } from "@/lib/atividade-mapper";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const owned = await prisma.atividade.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const historico = await prisma.historico.findMany({
    where: { atividadeId: id, userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(historico.map(historicoFromDb));
}
