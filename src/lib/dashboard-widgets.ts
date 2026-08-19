// Registry dos widgets do Dashboard (S8). Cada widget é identificado por uma
// chave estável (widgetId) — a ordem/visibilidade/tamanho de cada um é
// persistida em WidgetPreferencia, uma linha por usuário+widget.
//
// PROMPT 3 (1.1/1.3): os Campos 4-6 (Propostas, Empresas, Visão Geral), que
// eram renderizados fora do motor, entraram aqui. Nenhum indicador foi
// removido — eles apenas passaram a ser configuráveis como os demais.
//
// O componente de cada widget é resolvido em src/components/dashboard/
// widget-registry.tsx (este arquivo é importado pelo servidor, na rota de
// preferências, e não pode arrastar componentes de client junto).

export type WidgetTamanho = "normal" | "largo";

export interface WidgetDefinition {
  id: string;
  titulo: string;
  /** Descrição curta, mostrada na biblioteca de widgets. */
  descricao: string;
  /** Tamanho aplicado a quem nunca configurou nada. */
  tamanhoPadrao: WidgetTamanho;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    id: "resumo-geral",
    titulo: "Resumo geral",
    descricao: "Total de atividades do filtro atual.",
    tamanhoPadrao: "largo",
  },
  {
    id: "status",
    titulo: "Status",
    descricao: "Indicadores e distribuição por status.",
    tamanhoPadrao: "largo",
  },
  {
    id: "prioridade",
    titulo: "Prioridade",
    descricao: "Distribuição das atividades por prioridade.",
    tamanhoPadrao: "largo",
  },
  {
    id: "propostas",
    titulo: "Propostas",
    descricao: "Indicadores de proposta e gráficos por status e vencimento.",
    tamanhoPadrao: "largo",
  },
  {
    id: "empresas",
    titulo: "Empresas",
    descricao: "Atividades por empresa, tipo de produto e produtos vinculados.",
    tamanhoPadrao: "largo",
  },
  {
    id: "visao-geral",
    titulo: "Visão geral",
    descricao: "Distribuição por status e por prioridade, lado a lado.",
    tamanhoPadrao: "largo",
  },
];

export interface WidgetPreferenciaResolvida {
  widgetId: string;
  ordem: number;
  visivel: boolean;
  tamanho: WidgetTamanho;
}

export interface WidgetPreferenciaBruta {
  widgetId: string;
  ordem: number;
  visivel: boolean;
  tamanho: string;
}

// Mescla o que está persistido com os defaults para widgets sem linha ainda
// (usuário novo, ou widget adicionado depois que o usuário já tinha preferências
// salvas) — nunca deixa um widget "sumir" só por falta de registro no banco.
export function resolveWidgetPreferencias(
  persisted: WidgetPreferenciaBruta[]
): WidgetPreferenciaResolvida[] {
  const byId = new Map(persisted.map((p) => [p.widgetId, p]));
  return WIDGET_DEFINITIONS.map((def, index) => {
    const saved = byId.get(def.id);
    return {
      widgetId: def.id,
      ordem: saved?.ordem ?? index,
      visivel: saved?.visivel ?? true,
      // Default "largo" (largura total) preserva o layout empilhado que já
      // existia antes do motor de widgets — "normal" (meia largura) é uma
      // opção que o usuário escolhe, não o ponto de partida.
      tamanho: (saved?.tamanho as WidgetTamanho) ?? def.tamanhoPadrao,
    };
  }).sort((a, b) => a.ordem - b.ordem);
}

// PROMPT 3 (1.4) — "Restaurar Dashboard padrão": volta à composição inicial
// (todos visíveis, na ordem do registro, no tamanho padrão). Não apaga nada:
// como a preferência é sobrescrita e não removida, e o registro é a fonte da
// composição inicial, nenhum widget deixa de existir.
export function composicaoPadrao(): WidgetPreferenciaResolvida[] {
  return WIDGET_DEFINITIONS.map((def, index) => ({
    widgetId: def.id,
    ordem: index,
    visivel: true,
    tamanho: def.tamanhoPadrao,
  }));
}
