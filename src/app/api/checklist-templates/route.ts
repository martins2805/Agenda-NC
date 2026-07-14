import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderChecklistForInsert } from "@/lib/atividade-mapper";
import type { ChecklistTemplate } from "@/lib/types";

const include = { itens: true };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const templates = await prisma.checklistTemplate.findMany({
    where: { userId },
    include,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    templates.map((t) => ({
      id: t.id,
      nome: t.nome,
      itens: t.itens
        .sort((a, b) => a.ordem - b.ordem)
        .map((i) => ({ id: i.id, texto: i.texto, parentId: i.parentId })),
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as ChecklistTemplate;

  const created = await prisma.checklistTemplate.create({
    data: {
      id: body.id,
      userId,
      nome: body.nome,
      itens: {
        create: orderChecklistForInsert(
          body.itens.map((i, idx) => ({ ...i, ordem: idx }))
        ).map((i) => ({
          id: i.id,
          texto: i.texto,
          ordem: i.ordem,
          parentId: i.parentId,
        })),
      },
    },
    include,
  });

  return NextResponse.json(
    {
      id: created.id,
      nome: created.nome,
      itens: created.itens
        .sort((a, b) => a.ordem - b.ordem)
        .map((i) => ({ id: i.id, texto: i.texto, parentId: i.parentId })),
    },
    { status: 201 }
  );
}
