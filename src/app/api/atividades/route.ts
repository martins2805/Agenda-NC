import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { atividadeFromDb, statusToDb, prioridadeToDb } from "@/lib/atividade-mapper";
import type { Atividade } from "@/lib/types";

const include = { propostas: true, checklist: true };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const atividades = await prisma.atividade.findMany({
    include,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(atividades.map(atividadeFromDb));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Atividade;

  const created = await prisma.atividade.create({
    data: {
      id: body.id,
      empresaId: body.empresaId,
      unidadeId: body.unidadeId,
      assuntoId: body.assuntoId,
      tipoAtividadeIds: body.tipoAtividadeIds,
      emailConteudo: body.emailConteudo,
      oportunidadeTexto: body.oportunidadeTexto,
      contato: body.contato,
      prazo: body.prazo ? new Date(body.prazo) : null,
      descricao: body.descricao,
      status: statusToDb(body.status),
      prioridade: prioridadeToDb(body.prioridade),
      propostas: {
        create: body.propostas.map((p) => ({
          id: p.id,
          numero: p.numero,
          servicoProdutoIds: p.servicoProdutoIds,
          escopoIds: p.escopoIds,
          amostragemIds: p.amostragemIds,
          quantidade: p.quantidade,
          valorUnitario: p.valorUnitario,
          valorTotal: p.valorTotal,
        })),
      },
      checklist: {
        create: body.checklist.map((c, i) => ({
          id: c.id,
          texto: c.texto,
          concluido: c.concluido,
          ordem: i,
        })),
      },
    },
    include,
  });

  return NextResponse.json(atividadeFromDb(created), { status: 201 });
}
