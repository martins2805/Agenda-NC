import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Planilha } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as Partial<Planilha>;

  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.empresaId !== undefined) data.empresaId = body.empresaId;
  if (body.unidadeId !== undefined) data.unidadeId = body.unidadeId;
  if (body.assuntoId !== undefined) data.assuntoId = body.assuntoId;
  if (body.categoriaIds !== undefined) data.categoriaIds = body.categoriaIds;
  if (body.atividadeId !== undefined) data.atividadeId = body.atividadeId;
  if (body.conteudo !== undefined) data.conteudo = body.conteudo;

  const updated = await prisma.planilha.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.planilha.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
