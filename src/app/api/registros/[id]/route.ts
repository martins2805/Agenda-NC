import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Registro } from "@/lib/types";

const include = { tabs: true };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as Registro;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.registroTab.deleteMany({ where: { registroId: id } });

    return tx.registro.update({
      where: { id },
      data: {
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
  });

  return NextResponse.json({
    ...updated,
    tabs: updated.tabs.sort((a, b) => a.ordem - b.ordem),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.registro.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
