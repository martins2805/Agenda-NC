// Registry dos widgets do Dashboard (S8). Cada widget é identificado por uma
// chave estável (widgetId) — a ordem/visibilidade/tamanho de cada um é
// persistida em WidgetPreferencia, uma linha por usuário+widget.
//
// Só os Campos 1-3 (escopo da S8) entram aqui. Campos 4-6 (Propostas,
// Empresas, Visão Geral) continuam renderizados por DashboardAnalytics sem
// passar pelo motor de widgets — formalizá-los como widget é escopo da S9.

export type WidgetTamanho = "normal" | "largo";

export interface WidgetDefinition {
  id: string;
  titulo: string;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: "resumo-geral", titulo: "Resumo geral" },
  { id: "status", titulo: "Status" },
  { id: "prioridade", titulo: "Prioridade" },
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
      tamanho: (saved?.tamanho as WidgetTamanho) ?? "largo",
    };
  }).sort((a, b) => a.ordem - b.ordem);
}
