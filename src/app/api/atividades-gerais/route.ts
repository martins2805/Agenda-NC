import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  atividadeGeralFromDb,
  prioridadeToDb,
  statusToDb,
} from "@/lib/atividade-mapper";
import type { AtividadeGeral } from "@/lib/types";

const include = { checklist: true };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const atividades = await prisma.atividadeGeral.findMany({
    where: { userId },
    include,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(atividades.map(atividadeGeralFromDb));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = (await request.json()) as AtividadeGeral;

  const created = await prisma.atividadeGeral.create({
    data: {
      id: body.id,
      userId,
      tipoIds: body.tipoIds,
      assunto: body.assunto,
      vinculos: body.vinculos,
      prazo: body.prazo ? new Date(body.prazo) : null,
      descricao: body.descricao,
      status: statusToDb(body.status),
      prioridade: prioridadeToDb(body.prioridade),
      setorIds: body.setorIds,
      checklist: {
        create: body.checklist.map((item, index) => ({
          id: item.id,
          parentId: item.parentId,
          texto: item.texto,
          status: item.status,
          prioridade: prioridadeToDb(item.prioridade),
          prazo: item.prazo ? new Date(item.prazo) : null,
          ordem: index,
        })),
      },
    },
    include,
  });

  return NextResponse.json(atividadeGeralFromDb(created), { status: 201 });
}
