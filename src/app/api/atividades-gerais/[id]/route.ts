import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { atividadeGeralFromDb, prioridadeToDb } from "@/lib/atividade-mapper";
import type { AtividadeGeral } from "@/lib/types";

const include = { checklist: true };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const owned = await prisma.atividadeGeral.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as AtividadeGeral;
  const updated = await prisma.$transaction(async (tx) => {
    await tx.checklistGeralItem.deleteMany({ where: { atividadeGeralId: id } });

    return tx.atividadeGeral.update({
      where: { id },
      data: {
        empresaId: body.empresaId,
        unidadeId: body.unidadeId,
        tipoIds: body.tipoIds,
        assunto: body.assunto,
        vinculos: body.vinculos,
        prazo: body.prazo ? new Date(body.prazo) : null,
        descricao: body.descricao,
        status: body.status,
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
            empresaId: item.empresaId,
            unidadeId: item.unidadeId,
          })),
        },
      },
      include,
    });
  });

  return NextResponse.json(atividadeGeralFromDb(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const result = await prisma.atividadeGeral.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
