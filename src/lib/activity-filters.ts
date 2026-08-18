import type { Atividade, Prioridade, StatusConclusao, StatusNegociacao } from "./types";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "./types";
import { htmlToSearchText } from "./utils";
import { matchesRecord, sortRecords, type FilterableRecord } from "./filters/engine";
import { filtersToParams as filtersToParamsGeneric, paramsToFilters as paramsToFiltersGeneric, type ListKeyDef } from "./filters/querystring";

export type { PrazoRange, OrderBy } from "./filters/types";
export { PRAZO_OPTIONS, ORDER_OPTIONS } from "./filters/types";
export { matchesPrazoRange, matchesPrazos } from "./filters/prazo";

import type { PrazoRange, OrderBy } from "./filters/types";

// Filtro combinável usado tanto no Dashboard quanto nas telas de Atividades e
// Execuções. Todos os campos de lista funcionam em modo OR interno e AND entre
// campos diferentes (combinação de filtros). A lógica de correspondência real
// mora em src/lib/filters/engine.ts — este arquivo é um adapter fino.
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
  statusNegociacao: StatusNegociacao[];
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
  statusNegociacao: [],
  ordenar: "criacao",
};

export const PRODUTO_TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: "MRR", label: "MRR" },
  { value: "PS", label: "PS" },
];

interface Lookups {
  empresa: { id: string; name: string }[];
  unidade: { id: string; name: string }[];
  tipoAtividade: { id: string; name: string }[];
}

// A descrição é HTML de editor rico e pode carregar imagens base64 de
// megabytes — usar o HTML bruto no searchText (como era antes da S16) fazia
// cada tecla do filtro de palavra-chave varrer megabytes por atividade e
// derrubava a aba do navegador. Cache por objeto: as atividades do estado são
// substituídas (não mutadas) a cada edição, então a chave se auto-invalida.
const descricaoLimpaCache = new WeakMap<Atividade, string>();

function descricaoLimpa(a: Atividade): string {
  let limpa = descricaoLimpaCache.get(a);
  if (limpa === undefined) {
    limpa = htmlToSearchText(a.descricao);
    descricaoLimpaCache.set(a, limpa);
  }
  return limpa;
}

function toRecord(a: Atividade, lookups: Lookups): FilterableRecord {
  const empresa = lookups.empresa.find((e) => e.id === a.empresaId)?.name ?? "";
  const unidade = lookups.unidade
    .filter((u) => a.unidadeIds.includes(u.id))
    .map((u) => u.name)
    .join(" ");
  const tipos = lookups.tipoAtividade
    .filter((t) => a.tipoAtividadeIds.includes(t.id))
    .map((t) => t.name)
    .join(" ");
  const checklist = a.checklist.map((c) => c.texto).join(" ");
  const propostas = a.propostas.map((p) => `${p.detalhe} ${p.observacao}`).join(" ");
  const searchText = [
    empresa,
    unidade,
    a.assunto,
    tipos,
    a.contato,
    descricaoLimpa(a),
    a.emailConteudo,
    a.oportunidadeTexto,
    a.status,
    a.prioridade,
    checklist,
    propostas,
  ].join(" ");

  return {
    empresaId: a.empresaId,
    unidadeIds: a.unidadeIds,
    tipoIds: a.tipoAtividadeIds,
    status: a.status,
    prioridade: a.prioridade,
    prazo: a.prazo,
    createdAt: a.createdAt,
    searchText,
  };
}

export function matchesActivity(a: Atividade, filters: ActivityFilters, lookups: Lookups): boolean {
  if (
    !matchesRecord(toRecord(a, lookups), {
      keyword: filters.keyword,
      empresaIds: filters.empresaIds,
      unidadeIds: filters.unidadeIds,
      tipoIds: filters.tipoAtividadeIds,
      status: filters.status,
      prioridades: filters.prioridades,
      prazos: filters.prazos,
    })
  )
    return false;

  // Campos específicos de Atividade (via Proposta), fora do motor genérico.
  if (
    filters.produtoTipos.length > 0 &&
    !a.propostas.some((p) => p.tipo && filters.produtoTipos.includes(p.tipo))
  )
    return false;
  if (
    filters.servicoProdutoIds.length > 0 &&
    !a.propostas.some((p) => p.servicoProdutoIds.some((id) => filters.servicoProdutoIds.includes(id)))
  )
    return false;
  if (
    filters.statusNegociacao.length > 0 &&
    !a.propostas.some((p) => p.statusNegociacao && filters.statusNegociacao.includes(p.statusNegociacao))
  )
    return false;

  return true;
}

export function sortActivities(list: Atividade[], ordenar: OrderBy): Atividade[] {
  const ordenada = sortRecords(list, ordenar, (a) => ({
    prazo: a.prazo,
    prioridade: a.prioridade,
    createdAt: a.createdAt,
  }));
  // S16 (PROMPT 2): concluídas sempre ao final, em qualquer ordenação. A
  // ordenação escolhida continua valendo dentro de cada grupo — isto é só
  // uma partição estável por cima, não uma segunda regra de ordenação.
  return [
    ...ordenada.filter((a) => a.status !== "Concluído"),
    ...ordenada.filter((a) => a.status === "Concluído"),
  ];
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
    filters.servicoProdutoIds.length > 0 ||
    filters.statusNegociacao.length > 0
  );
}

// --- Serialização para query string (direcionamento a partir do dashboard) ---

const LIST_KEYS: ListKeyDef<ActivityFilters>[] = [
  { key: "empresaIds", param: "emp" },
  { key: "unidadeIds", param: "uni" },
  { key: "tipoAtividadeIds", param: "tipo" },
  { key: "status", param: "st" },
  { key: "prioridades", param: "prio" },
  { key: "prazos", param: "prazo" },
  { key: "produtoTipos", param: "ptipo" },
  { key: "servicoProdutoIds", param: "prod" },
  { key: "statusNegociacao", param: "stneg" },
];

export function filtersToParams(filters: ActivityFilters): URLSearchParams {
  return filtersToParamsGeneric(filters, LIST_KEYS);
}

export function paramsToFilters(sp: URLSearchParams): ActivityFilters {
  return paramsToFiltersGeneric(sp, DEFAULT_FILTERS, LIST_KEYS);
}

// Combina os filtros vindos do dashboard com filtros extras específicos do KPI
// clicado (ex.: status = Pendente) e devolve a query string para o link.
export function mergeFilters(base: ActivityFilters, extra: Partial<ActivityFilters>): ActivityFilters {
  return { ...base, ...extra };
}

export function atividadesHref(base: ActivityFilters, extra: Partial<ActivityFilters> = {}): string {
  const params = filtersToParams(mergeFilters(base, extra));
  const qs = params.toString();
  return qs ? `/atividades?${qs}` : "/atividades";
}

export const STATUS_ALL = STATUS_OPTIONS;
export const PRIORIDADE_ALL = PRIORIDADE_OPTIONS;
