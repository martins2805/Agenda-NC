import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { atividadeGeralFromDb, prioridadeToDb } from "@/lib/atividade-mapper";
import { listarVinculadosEmLote, syncVinculos } from "@/lib/vinculos";
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
  const vinculosPorId = await listarVinculadosEmLote(
    prisma,
    userId,
    "atividadeGeral",
    atividades.map((a) => a.id),
    "atividade"
  );

  return NextResponse.json(
    atividades.map((a) => atividadeGeralFromDb(a, vinculosPorId.get(a.id) ?? []))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = (await request.json()) as AtividadeGeral;

  const created = await prisma.$transaction(async (tx) => {
    const atividadeGeral = await tx.atividadeGeral.create({
      data: {
        id: body.id,
        userId,
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
    await syncVinculos(
      tx,
      userId,
      { tipo: "atividadeGeral", id: atividadeGeral.id },
      "atividade",
      body.atividadeIds ?? []
    );
    return atividadeGeral;
  });

  return NextResponse.json(atividadeGeralFromDb(created, body.atividadeIds ?? []), { status: 201 });
}
