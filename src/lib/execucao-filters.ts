import type { AtividadeGeral, Prioridade, StatusGeral } from "./types";
import { matchesRecord, sortRecords, type FilterableRecord } from "./filters/engine";
import type { OrderBy, PrazoRange } from "./filters/types";
import { filtersToParams as filtersToParamsGeneric, paramsToFilters as paramsToFiltersGeneric, type ListKeyDef } from "./filters/querystring";

export interface ExecucaoFilters {
  keyword: string;
  empresaIds: string[];
  unidadeIds: string[];
  tipoIds: string[];
  status: StatusGeral[];
  prioridades: Prioridade[];
  prazos: PrazoRange[];
  setorIds: string[];
  ordenar: OrderBy;
}

export const DEFAULT_EXECUCAO_FILTERS: ExecucaoFilters = {
  keyword: "",
  empresaIds: [],
  unidadeIds: [],
  tipoIds: [],
  status: [],
  prioridades: [],
  prazos: [],
  setorIds: [],
  ordenar: "criacao",
};

interface Lookups {
  empresa: { id: string; name: string }[];
  unidade: { id: string; name: string }[];
  tipoAtividadeGeral: { id: string; name: string }[];
  setorInterno: { id: string; name: string }[];
}

function toRecord(a: AtividadeGeral, lookups: Lookups): FilterableRecord {
  const empresa = lookups.empresa.find((e) => e.id === a.empresaId)?.name ?? "";
  const unidade = lookups.unidade.find((u) => u.id === a.unidadeId)?.name ?? "";
  const tipos = lookups.tipoAtividadeGeral
    .filter((t) => a.tipoIds.includes(t.id))
    .map((t) => t.name)
    .join(" ");
  const setores = lookups.setorInterno
    .filter((s) => a.setorIds.includes(s.id))
    .map((s) => s.name)
    .join(" ");
  const checklist = a.checklist.map((c) => c.texto).join(" ");
  const searchText = [empresa, unidade, a.assunto, a.descricao, a.vinculos, tipos, setores, checklist].join(" ");

  return {
    empresaId: a.empresaId,
    unidadeId: a.unidadeId,
    tipoIds: a.tipoIds,
    status: a.status,
    prioridade: a.prioridade,
    prazo: a.prazo,
    createdAt: a.createdAt,
    searchText,
  };
}

export function matchesExecucao(a: AtividadeGeral, filters: ExecucaoFilters, lookups: Lookups): boolean {
  if (
    !matchesRecord(toRecord(a, lookups), {
      keyword: filters.keyword,
      empresaIds: filters.empresaIds,
      unidadeIds: filters.unidadeIds,
      tipoIds: filters.tipoIds,
      status: filters.status,
      prioridades: filters.prioridades,
      prazos: filters.prazos,
    })
  )
    return false;

  // Setor interno é específico de Execução, fora do motor genérico (mesmo
  // padrão de produto/serviço em activity-filters.ts).
  if (filters.setorIds.length > 0 && !filters.setorIds.some((id) => a.setorIds.includes(id))) return false;

  return true;
}

export function sortExecucoes(list: AtividadeGeral[], ordenar: OrderBy): AtividadeGeral[] {
  return sortRecords(list, ordenar, (a) => ({
    prazo: a.prazo,
    prioridade: a.prioridade,
    createdAt: a.createdAt,
  }));
}

export function hasActiveExecucaoFilters(f: ExecucaoFilters): boolean {
  return (
    f.keyword.trim() !== "" ||
    f.empresaIds.length > 0 ||
    f.unidadeIds.length > 0 ||
    f.tipoIds.length > 0 ||
    f.status.length > 0 ||
    f.prioridades.length > 0 ||
    f.prazos.length > 0 ||
    f.setorIds.length > 0
  );
}

const LIST_KEYS: ListKeyDef<ExecucaoFilters>[] = [
  { key: "empresaIds", param: "emp" },
  { key: "unidadeIds", param: "uni" },
  { key: "tipoIds", param: "tipo" },
  { key: "status", param: "st" },
  { key: "prioridades", param: "prio" },
  { key: "prazos", param: "prazo" },
  { key: "setorIds", param: "setor" },
];

// Leitura completa (usada tanto pelo dashboard quanto pela própria tela de
// Execuções, que agora também escreve de volta na URL — mesma simetria de
// activity-filters.ts, para "a URL reproduz exatamente o estado" (S13).
export function execucaoFiltersFromParams(sp: URLSearchParams): ExecucaoFilters {
  return paramsToFiltersGeneric(sp, DEFAULT_EXECUCAO_FILTERS, LIST_KEYS);
}

export function execucaoFiltersToParams(filters: ExecucaoFilters): URLSearchParams {
  return filtersToParamsGeneric(filters, LIST_KEYS);
}
