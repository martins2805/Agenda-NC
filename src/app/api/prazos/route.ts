import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Consulta direta à view prazo_unificado (fonte única de prazos, regra 4 do
// CLAUDE.md). Sem consumidor de UI nesta sprint — Dashboard e Calendário
// continuam agregando prazos em memória (rewire é escopo de S7/S8). Esta
// rota existe para tornar a view testável fora do psql e para consumidores
// futuros.

interface PrazoUnificadoRow {
  user_id: string;
  objeto_tipo: string;
  objeto_id: string;
  origem_tipo: string;
  titulo: string;
  empresa_id: string | null;
  unidade_id: string | null;
  data: Date;
  prioridade: string;
  status: string;
  tipo_prazo: string;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const rows = await prisma.$queryRaw<PrazoUnificadoRow[]>`
    SELECT * FROM prazo_unificado WHERE user_id = ${userId} ORDER BY data ASC
  `;

  return NextResponse.json(
    rows.map((r) => ({
      objetoTipo: r.objeto_tipo,
      objetoId: r.objeto_id,
      origemTipo: r.origem_tipo,
      titulo: r.titulo,
      empresaId: r.empresa_id,
      unidadeId: r.unidade_id,
      data: r.data.toISOString(),
      prioridade: r.prioridade,
      status: r.status,
      tipoPrazo: r.tipo_prazo,
    }))
  );
}
