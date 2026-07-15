import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderChecklistForInsert } from "@/lib/atividade-mapper";
import type { ChecklistTemplate } from "@/lib/types";

const include = { itens: true };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const body = (await request.json()) as ChecklistTemplate;

  const existing = await prisma.checklistTemplate.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.checklistTemplateItem.deleteMany({ where: { templateId: id } });
  const updated = await prisma.checklistTemplate.update({
    where: { id },
    data: {
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

  return NextResponse.json({
    id: updated.id,
    nome: updated.nome,
    itens: updated.itens
      .sort((a, b) => a.ordem - b.ordem)
      .map((i) => ({ id: i.id, texto: i.texto, parentId: i.parentId })),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const result = await prisma.checklistTemplate.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
