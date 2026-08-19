import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  VISUAL_ELEMENTS,
  VISUAL_COR_OPTIONS,
  VISUAL_TAMANHOS,
  configPadrao,
  type ConfiguracaoVisual,
  type VisualCor,
  type VisualTamanho,
} from "@/lib/visual-config";
import { CAMPOS_LISTA, CAMPOS_CARD, chaveExibicao } from "@/lib/exibicao-config";

// PROMPT 3 (3.1/3.2/3.3): configuração centralizada. Duas famílias de chave
// convivem nesta tabela:
//   "status:…", "prioridade:…", "prazo:…", "negociacao:…"  -> cor e tamanho
//   "lista:…", "card:…"                                     -> exibição e ordem
// Mesmo padrão de /api/widget-preferencias: GET resolve contra os padrões,
// PUT faz upsert em transação e devolve o estado final.

// Ordem inicial de cada chave, para quem nunca configurou nada.
const ORDEM_PADRAO = new Map<string, number>([
  ...CAMPOS_LISTA.map((c, i) => [chaveExibicao("lista", c.campo), i] as const),
  ...CAMPOS_CARD.map((c, i) => [chaveExibicao("card", c.campo), i] as const),
]);

const CHAVES_CONHECIDAS = [
  ...VISUAL_ELEMENTS.map((e) => e.chave),
  ...ORDEM_PADRAO.keys(),
];

interface LinhaBanco {
  chave: string;
  cor: string | null;
  tamanho: string | null;
  visivel: boolean;
  ordem: number;
}

// Chave sem linha no banco nunca "some": vem com o padrão do sistema.
function resolver(rows: LinhaBanco[]): ConfiguracaoVisual[] {
  const porChave = new Map(rows.map((r) => [r.chave, r]));
  return CHAVES_CONHECIDAS.map((chave) => {
    const row = porChave.get(chave);
    if (!row) return configPadrao(chave, ORDEM_PADRAO.get(chave) ?? 0);
    return {
      chave,
      // Valor fora da paleta conhecida (dado antigo, edição manual no banco)
      // volta a null em vez de virar CSS inválido.
      cor: VISUAL_COR_OPTIONS.includes(row.cor as VisualCor) ? (row.cor as VisualCor) : null,
      tamanho: VISUAL_TAMANHOS.includes(row.tamanho as VisualTamanho)
        ? (row.tamanho as VisualTamanho)
        : null,
      visivel: row.visivel,
      ordem: row.ordem,
    } satisfies ConfiguracaoVisual;
  });
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.configuracaoVisual.findMany({ where: { userId: session.user.id } });
  return NextResponse.json(resolver(rows));
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = (await request.json()) as ConfiguracaoVisual[];
  const validas = new Set(CHAVES_CONHECIDAS);

  // Só grava chaves do registro e valores da paleta — o corpo da requisição
  // não decide o que é uma chave válida.
  const aceitas = body.filter((c) => validas.has(c.chave));

  await prisma.$transaction(
    aceitas.map((c) => {
      const cor = VISUAL_COR_OPTIONS.includes(c.cor as VisualCor) ? c.cor : null;
      const tamanho = VISUAL_TAMANHOS.includes(c.tamanho as VisualTamanho) ? c.tamanho : null;
      const ordem = Number.isFinite(c.ordem) ? c.ordem : 0;
      return prisma.configuracaoVisual.upsert({
        where: { userId_chave: { userId, chave: c.chave } },
        create: { userId, chave: c.chave, cor, tamanho, visivel: c.visivel, ordem },
        update: { cor, tamanho, visivel: c.visivel, ordem },
      });
    }),
    // Reordenar uma lista inteira manda dezenas de chaves de uma vez; com o
    // banco remoto, o default de 5s não cobre isso (P2028).
    { timeout: 20000 }
  );

  const rows = await prisma.configuracaoVisual.findMany({ where: { userId } });
  return NextResponse.json(resolver(rows));
}

// "Restaurar padrão": apaga as linhas do usuário. Como chave sem linha cai no
// padrão do sistema, isso devolve o visual original sem perder mais nada.
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.configuracaoVisual.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json(resolver([]));
}
