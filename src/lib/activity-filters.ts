import type { Atividade, Prioridade, StatusConclusao } from "./types";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "./types";
import { parseLocalDate } from "./calculations";

export type PrazoRange = "atrasadas" | "hoje" | "7dias" | "30dias";
export type OrderBy = "criacao" | "prazo" | "prioridade";

// Filtro combinável usado tanto no Dashboard quanto nas telas de Atividades e
// Execuções. Todos os campos de lista funcionam em modo OR interno e AND entre
// campos diferentes (combinação de filtros).
export interface ActivityFilters {
  keyword: string;
  empresaIds: string[];
  unidadeIds: string[];
  tipoAtividadeIds: string[];
  status: StatusConclusao[];
  prioridades: Prioridade[];
  prazos: PrazoRange[];
  produtoTipos: string[]; // MRR | PS
  servicoProdutoIds: string[];
  ordenar: OrderBy;
}

export const DEFAULT_FILTERS: ActivityFilters = {
  keyword: "",
  empresaIds: [],
  unidadeIds: [],
  tipoAtividadeIds: [],
  status: [],
  prioridades: [],
  prazos: [],
  produtoTipos: [],
  servicoProdutoIds: [],
  ordenar: "criacao",
};

export const PRAZO_OPTIONS: { value: PrazoRange; label: string }[] = [
  { value: "atrasadas", label: "Atrasadas" },
  { value: "hoje", label: "Vencem hoje" },
  { value: "7dias", label: "Próximos 7 dias" },
  { value: "30dias", label: "Próximos 30 dias" },
];

export const PRODUTO_TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: "MRR", label: "MRR" },
  { value: "PS", label: "PS" },
];

export const ORDER_OPTIONS: { value: OrderBy; label: string }[] = [
  { value: "criacao", label: "Data de criação" },
  { value: "prazo", label: "Prazo" },
  { value: "prioridade", label: "Prioridade" },
];

export function matchesPrazoRange(prazo: string | null, mode: PrazoRange) {
  if (!prazo) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseLocalDate(prazo);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (mode === "atrasadas") return diffDays < 0;
  if (mode === "hoje") return diffDays === 0;
  if (mode === "7dias") return diffDays >= 0 && diffDays <= 7;
  if (mode === "30dias") return diffDays >= 0 && diffDays <= 30;
  return true;
}

// Um dos intervalos selecionados basta (OR). Sem seleção, não filtra por prazo.
export function matchesPrazos(prazo: string | null, ranges: PrazoRange[]) {
  if (ranges.length === 0) return true;
  return ranges.some((range) => matchesPrazoRange(prazo, range));
}

interface Lookups {
  empresa: { id: string; name: string }[];
  unidade: { id: string; name: string }[];
  tipoAtividade: { id: string; name: string }[];
}

export function matchesActivity(
  a: Atividade,
  filters: ActivityFilters,
  lookups: Lookups
): boolean {
  if (
    filters.empresaIds.length > 0 &&
    !(a.empresaId && filters.empresaIds.includes(a.empresaId))
  )
    return false;
  if (
    filters.unidadeIds.length > 0 &&
    !(a.unidadeId && filters.unidadeIds.includes(a.unidadeId))
  )
    return false;
  if (
    filters.tipoAtividadeIds.length > 0 &&
    !filters.tipoAtividadeIds.some((id) => a.tipoAtividadeIds.includes(id))
  )
    return false;
  if (filters.status.length > 0 && !filters.status.includes(a.status)) return false;
  if (filters.prioridades.length > 0 && !filters.prioridades.includes(a.prioridade))
    return false;
  if (!matchesPrazos(a.prazo, filters.prazos)) return false;

  if (
    filters.produtoTipos.length > 0 &&
    !a.propostas.some((p) => p.tipo && filters.produtoTipos.includes(p.tipo))
  )
    return false;
  if (
    filters.servicoProdutoIds.length > 0 &&
    !a.propostas.some((p) =>
      p.servicoProdutoIds.some((id) => filters.servicoProdutoIds.includes(id))
    )
  )
    return false;

  const keyword = filters.keyword.trim().toLowerCase();
  if (keyword) {
    const empresa = lookups.empresa.find((e) => e.id === a.empresaId)?.name ?? "";
    const unidade = lookups.unidade.find((u) => u.id === a.unidadeId)?.name ?? "";
    const tipos = lookups.tipoAtividade
      .filter((t) => a.tipoAtividadeIds.includes(t.id))
      .map((t) => t.name)
      .join(" ");
    const checklist = a.checklist.map((c) => c.texto).join(" ");
    const propostas = a.propostas
      .map((p) => `${p.detalhe} ${p.observacao}`)
      .join(" ");
    const haystack = [
      empresa,
      unidade,
      a.assunto,
      tipos,
      a.contato,
      a.descricao,
      a.emailConteudo,
      a.oportunidadeTexto,
      a.status,
      a.prioridade,
      checklist,
      propostas,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }

  return true;
}

const PRIORIDADE_RANK: Record<Prioridade, number> = {
  Urgente: 0,
  Importante: 1,
  Médio: 2,
  Baixo: 3,
};

export function sortActivities(list: Atividade[], ordenar: OrderBy): Atividade[] {
  const copy = [...list];
  if (ordenar === "prazo") {
    copy.sort((a, b) => {
      if (!a.prazo && !b.prazo) return 0;
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return a.prazo.localeCompare(b.prazo);
    });
  } else if (ordenar === "prioridade") {
    copy.sort((a, b) => PRIORIDADE_RANK[a.prioridade] - PRIORIDADE_RANK[b.prioridade]);
  } else {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return copy;
}

export function hasActiveFilters(filters: ActivityFilters): boolean {
  return (
    filters.keyword.trim() !== "" ||
    filters.empresaIds.length > 0 ||
    filters.unidadeIds.length > 0 ||
    filters.tipoAtividadeIds.length > 0 ||
    filters.status.length > 0 ||
    filters.prioridades.length > 0 ||
    filters.prazos.length > 0 ||
    filters.produtoTipos.length > 0 ||
    filters.servicoProdutoIds.length > 0
  );
}

// --- Serialização para query string (direcionamento a partir do dashboard) ---

const LIST_KEYS: {
  key: keyof ActivityFilters;
  param: string;
}[] = [
  { key: "empresaIds", param: "emp" },
  { key: "unidadeIds", param: "uni" },
  { key: "tipoAtividadeIds", param: "tipo" },
  { key: "status", param: "st" },
  { key: "prioridades", param: "prio" },
  { key: "prazos", param: "prazo" },
  { key: "produtoTipos", param: "ptipo" },
  { key: "servicoProdutoIds", param: "prod" },
];

export function filtersToParams(filters: ActivityFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.keyword.trim()) sp.set("kw", filters.keyword.trim());
  for (const { key, param } of LIST_KEYS) {
    const value = filters[key] as string[];
    if (value.length > 0) sp.set(param, value.join(","));
  }
  if (filters.ordenar !== "criacao") sp.set("ord", filters.ordenar);
  return sp;
}

export function paramsToFilters(sp: URLSearchParams): ActivityFilters {
  const filters: ActivityFilters = {
    ...DEFAULT_FILTERS,
    keyword: sp.get("kw") ?? "",
  };
  for (const { key, param } of LIST_KEYS) {
    const raw = sp.get(param);
    if (raw) {
      (filters[key] as string[]) = raw.split(",").filter(Boolean);
    }
  }
  const ord = sp.get("ord");
  if (ord === "prazo" || ord === "prioridade" || ord === "criacao") {
    filters.ordenar = ord;
  }
  return filters;
}

// Combina os filtros vindos do dashboard com filtros extras específicos do KPI
// clicado (ex.: status = Pendente) e devolve a query string para o link.
export function mergeFilters(
  base: ActivityFilters,
  extra: Partial<ActivityFilters>
): ActivityFilters {
  return { ...base, ...extra };
}

export function atividadesHref(
  base: ActivityFilters,
  extra: Partial<ActivityFilters> = {}
): string {
  const params = filtersToParams(mergeFilters(base, extra));
  const qs = params.toString();
  return qs ? `/atividades?${qs}` : "/atividades";
}

export function execucoesHref(
  base: ActivityFilters,
  extra: Partial<ActivityFilters> = {}
): string {
  const params = filtersToParams(mergeFilters(base, extra));
  const qs = params.toString();
  return qs ? `/atividades-gerais?${qs}` : "/atividades-gerais";
}

// Registros/Planilhas usam filtros mais simples (empresa única + palavra-chave).
export function simpleHref(basePath: string, base: ActivityFilters): string {
  const sp = new URLSearchParams();
  if (base.keyword.trim()) sp.set("kw", base.keyword.trim());
  if (base.empresaIds.length > 0) sp.set("emp", base.empresaIds[0]);
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export const STATUS_ALL = STATUS_OPTIONS;
export const PRIORIDADE_ALL = PRIORIDADE_OPTIONS;
