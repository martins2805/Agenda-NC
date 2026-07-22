import type { AtividadeGeral, Prioridade, StatusGeral } from "./types";
import { matchesRecord, sortRecords, type FilterableRecord } from "./filters/engine";
import type { OrderBy, PrazoRange } from "./filters/types";

export interface ExecucaoFilters {
  keyword: string;
  empresaIds: string[];
  unidadeIds: string[];
  tipoIds: string[];
  status: StatusGeral[];
  prioridades: Prioridade[];
  prazos: PrazoRange[];
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
  return matchesRecord(toRecord(a, lookups), {
    keyword: filters.keyword,
    empresaIds: filters.empresaIds,
    unidadeIds: filters.unidadeIds,
    tipoIds: filters.tipoIds,
    status: filters.status,
    prioridades: filters.prioridades,
    prazos: filters.prazos,
  });
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
    f.prazos.length > 0
  );
}

// Lê os parâmetros compartilhados vindos do dashboard (apenas dimensões
// compatíveis com execuções).
export function execucaoFiltersFromParams(sp: URLSearchParams): ExecucaoFilters {
  const filters: ExecucaoFilters = { ...DEFAULT_EXECUCAO_FILTERS, keyword: sp.get("kw") ?? "" };
  const emp = sp.get("emp");
  if (emp) filters.empresaIds = emp.split(",").filter(Boolean);
  const uni = sp.get("uni");
  if (uni) filters.unidadeIds = uni.split(",").filter(Boolean);
  const prio = sp.get("prio");
  if (prio) filters.prioridades = prio.split(",").filter(Boolean) as Prioridade[];
  const prazo = sp.get("prazo");
  if (prazo) filters.prazos = prazo.split(",").filter(Boolean) as PrazoRange[];
  return filters;
}
