import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { atividadeFromDb, statusToDb, prioridadeToDb } from "@/lib/atividade-mapper";
import { syncKnowledgeChunk, serializeAtividade } from "@/lib/knowledge-sync";
import type { Atividade } from "@/lib/types";

const include = { propostas: true, checklist: true };

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const atividades = await prisma.atividade.findMany({
    where: { userId, deletedAt: null },
    include,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(atividades.map(atividadeFromDb));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as Atividade;

  const created = await prisma.atividade.create({
    data: {
      id: body.id,
      userId,
      empresaId: body.empresaId,
      unidadeId: body.unidadeId,
      assunto: body.assunto,
      tipoAtividadeIds: body.tipoAtividadeIds,
      emailConteudo: body.emailConteudo,
      oportunidadeTexto: body.oportunidadeTexto,
      contato: body.contato,
      prazo: body.prazo ? new Date(body.prazo) : null,
      prazoFim: body.prazoFim ? new Date(body.prazoFim) : null,
      descricao: body.descricao,
      alinhamentos: body.alinhamentos,
      status: statusToDb(body.status),
      prioridade: prioridadeToDb(body.prioridade),
      concluidoEm: body.status === "Concluído" ? new Date() : null,
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
          tipo: p.tipo,
          detalhe: p.detalhe,
          observacao: p.observacao,
          prazoInicio: p.prazoInicio ? new Date(p.prazoInicio) : null,
          prazoFim: p.prazoFim ? new Date(p.prazoFim) : null,
          statusNegociacao: p.statusNegociacao,
        })),
      },
      checklist: {
        create: body.checklist.map((c, i) => ({
          id: c.id,
          texto: c.texto,
          concluido: c.concluido,
          parentId: c.parentId ?? null,
          ordem: i,
          prazo: c.prazo ? new Date(c.prazo) : null,
        })),
      },
    },
    include,
  });

  serializeAtividade(created)
    .then((content) => syncKnowledgeChunk(userId, "atividade", created.id, content))
    .catch((error) => console.error("Falha ao indexar atividade", error));

  return NextResponse.json(atividadeFromDb(created), { status: 201 });
}
