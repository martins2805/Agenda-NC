import { STATUS_OPTIONS, PRIORIDADE_OPTIONS, STATUS_NEGOCIACAO_LABELS } from "./types";
import type { StatusNegociacao } from "./types";
import { PRAZO_LABELS } from "./status-colors";

// PROMPT 3 (3.1/3.2/6) — configuração visual centralizada.
//
// A ideia que faz o item 3.2 ("aplicar em todas as telas") sair de graça: toda
// tela já lê a cor destes elementos por `var(--token)` (globals.css). Então
// configurar = redefinir a variável no :root, uma vez, e todas as telas mudam
// juntas — cards, lista, detalhe, dashboard e calendário. Nenhuma tela ganha
// configuração própria, que é justamente o que o item 3.2 proíbe.
//
// Este arquivo é a fonte única de quais elementos são configuráveis. Os mapas
// de estilo (status-colors.ts, dashboard-shared.tsx) continuam existindo e
// continuam apontando para as mesmas variáveis — eles não precisam saber que
// existe configuração.

export type VisualGroup = "status" | "prioridade" | "prazo" | "negociacao";

export interface VisualElement {
  /** Chave estável usada no banco. Nunca traduzir nem renomear. */
  chave: string;
  /** Nome da custom property redefinida no :root (sem os dois hífens). */
  token: string;
  grupo: VisualGroup;
  rotulo: string;
}

export const VISUAL_GROUP_LABELS: Record<VisualGroup, string> = {
  status: "Status",
  prioridade: "Prioridade",
  prazo: "Prazo",
  negociacao: "Status de negociação",
};

// Status distintos por cor: "Aguardando retorno interno" e "...cliente"
// compartilham o mesmo token (--status-outro), como já era antes.
const STATUS_TOKEN: Record<string, string> = {
  Concluído: "status-concluido",
  Pendente: "status-pendente",
  "Aguardando retorno interno": "status-outro",
  "Aguardando retorno cliente": "status-outro",
};

const PRIORIDADE_TOKEN: Record<string, string> = {
  Urgente: "prioridade-urgente",
  Importante: "prioridade-importante",
  Médio: "prioridade-medio",
  Baixo: "prioridade-baixo",
};

const PRAZO_TOKEN: Record<string, string> = {
  "em-dia": "prazo-em-dia",
  proximo: "prazo-proximo",
  vencido: "prazo-vencido",
};

const NEGOCIACAO_TOKEN: Record<StatusNegociacao, string> = {
  em_andamento: "negociacao-em-andamento",
  fup: "negociacao-fup",
  aceite: "negociacao-aceite",
  na: "negociacao-na",
};

function dedupePorToken(elements: VisualElement[]): VisualElement[] {
  const vistos = new Set<string>();
  return elements.filter((e) => {
    if (vistos.has(e.token)) return false;
    vistos.add(e.token);
    return true;
  });
}

export const VISUAL_ELEMENTS: VisualElement[] = dedupePorToken([
  ...STATUS_OPTIONS.map((s) => ({
    chave: `status:${STATUS_TOKEN[s]}`,
    token: STATUS_TOKEN[s],
    grupo: "status" as const,
    // Os dois "aguardando retorno" caem no mesmo token; o rótulo genérico
    // evita prometer que dá para colorir um sem o outro (Regra 11).
    rotulo: STATUS_TOKEN[s] === "status-outro" ? "Aguardando retorno" : s,
  })),
  ...PRIORIDADE_OPTIONS.map((p) => ({
    chave: `prioridade:${PRIORIDADE_TOKEN[p]}`,
    token: PRIORIDADE_TOKEN[p],
    grupo: "prioridade" as const,
    rotulo: p,
  })),
  ...(Object.keys(PRAZO_TOKEN) as (keyof typeof PRAZO_LABELS)[]).map((k) => ({
    chave: `prazo:${PRAZO_TOKEN[k]}`,
    token: PRAZO_TOKEN[k],
    grupo: "prazo" as const,
    rotulo: PRAZO_LABELS[k],
  })),
  ...(Object.keys(NEGOCIACAO_TOKEN) as StatusNegociacao[]).map((n) => ({
    chave: `negociacao:${NEGOCIACAO_TOKEN[n]}`,
    token: NEGOCIACAO_TOKEN[n],
    grupo: "negociacao" as const,
    rotulo: STATUS_NEGOCIACAO_LABELS[n],
  })),
]);

// Paleta oferecida ao usuário. Regra 2 do CLAUDE.md: nenhum valor visual solto
// no código — a escolha é sempre um token existente, nunca um hex digitado.
// Mesmo princípio já usado na cor de item de catálogo (LookupCor).
export const VISUAL_COR_OPTIONS = [
  "status-concluido",
  "status-pendente",
  "status-em-andamento",
  "status-outro",
  "prioridade-urgente",
  "prioridade-importante",
  "prioridade-medio",
  "prioridade-baixo",
  "prazo-em-dia",
  "prazo-proximo",
  "prazo-vencido",
  "base-1",
  "base-2",
  "base-3",
  "base-4",
  "base-5",
] as const;

export type VisualCor = (typeof VISUAL_COR_OPTIONS)[number];

export const VISUAL_TAMANHOS = ["compacto", "normal", "grande"] as const;
export type VisualTamanho = (typeof VISUAL_TAMANHOS)[number];

export const VISUAL_TAMANHO_LABELS: Record<VisualTamanho, string> = {
  compacto: "Compacto",
  normal: "Normal",
  grande: "Grande",
};

/** Uma linha de configuração. Campo null = "usar o padrão do sistema". */
export interface ConfiguracaoVisual {
  chave: string;
  cor: VisualCor | null;
  tamanho: VisualTamanho | null;
  visivel: boolean;
  /** Só usado pelas chaves de exibição de Lista/Cards (ver exibicao-config.ts). */
  ordem: number;
}

export function configPadrao(chave: string, ordem = 0): ConfiguracaoVisual {
  return { chave, cor: null, tamanho: null, visivel: true, ordem };
}

// Escala aplicada às etiquetas (badges) de status/prioridade/prazo. Vira uma
// custom property só, consumida pela regra .semantic-badge em globals.css —
// por isso mudar o tamanho também vale para todas as telas de uma vez.
const ESCALA: Record<VisualTamanho, string> = {
  compacto: "0.85",
  normal: "1",
  grande: "1.2",
};

/**
 * Monta o CSS que redefine os tokens conforme a configuração salva. É injetado
 * uma única vez, no shell — ver src/components/visual-config-style.tsx.
 * Só emite as linhas que realmente diferem do padrão: sem configuração, o
 * resultado é string vazia e o globals.css vale integralmente.
 */
export function visualConfigToCss(configs: ConfiguracaoVisual[]): string {
  const porChave = new Map(configs.map((c) => [c.chave, c]));
  const linhas: string[] = [];

  for (const el of VISUAL_ELEMENTS) {
    const cfg = porChave.get(el.chave);
    if (cfg?.cor) linhas.push(`--${el.token}: var(--${cfg.cor});`);
  }

  // O tamanho é global às etiquetas, não por elemento: pega o primeiro
  // definido, na ordem do registro.
  const tamanho = VISUAL_ELEMENTS.map((el) => porChave.get(el.chave)?.tamanho).find(
    (t): t is VisualTamanho => !!t
  );
  if (tamanho) linhas.push(`--badge-escala: ${ESCALA[tamanho]};`);

  if (linhas.length === 0) return "";
  return `:root{${linhas.join("")}}`;
}
