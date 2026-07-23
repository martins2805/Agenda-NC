import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLocalDateTimeString } from "@/lib/atividade-mapper";

// Consulta direta à view prazo_unificado (fonte única de prazos, regra 4 do
// CLAUDE.md). Consumida pelo calendário (S7, ver src/components/atividades/
// activity-calendar.tsx) via src/lib/prazo-filters.ts.

interface PrazoUnificadoRow {
  user_id: string;
  objeto_tipo: string;
  objeto_id: string;
  origem_tipo: string;
  origem_id: string;
  titulo: string;
  empresa_id: string | null;
  unidade_id: string | null;
  data: Date;
  prioridade: string;
  status: string;
  tipo_prazo: string;
  tipo_atividade_ids: string[] | null;
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
      origemId: r.origem_id,
      titulo: r.titulo,
      empresaId: r.empresa_id,
      unidadeId: r.unidade_id,
      data: toLocalDateTimeString(r.data),
      prioridade: r.prioridade,
      status: r.status,
      tipoPrazo: r.tipo_prazo,
      tipoAtividadeIds: r.tipo_atividade_ids ?? [],
    }))
  );
}
