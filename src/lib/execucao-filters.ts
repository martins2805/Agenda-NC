import type { AtividadeGeral, Prioridade, StatusGeral } from "./types";
import { matchesPrazos, type OrderBy, type PrazoRange } from "./activity-filters";

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

export function matchesExecucao(
  a: AtividadeGeral,
  filters: ExecucaoFilters,
  lookups: Lookups
): boolean {
  if (filters.empresaIds.length > 0 && !(a.empresaId && filters.empresaIds.includes(a.empresaId)))
    return false;
  if (filters.unidadeIds.length > 0 && !(a.unidadeId && filters.unidadeIds.includes(a.unidadeId)))
    return false;
  if (filters.tipoIds.length > 0 && !filters.tipoIds.some((id) => a.tipoIds.includes(id)))
    return false;
  if (filters.status.length > 0 && !filters.status.includes(a.status)) return false;
  if (filters.prioridades.length > 0 && !filters.prioridades.includes(a.prioridade)) return false;
  if (!matchesPrazos(a.prazo, filters.prazos)) return false;

  const kw = filters.keyword.trim().toLowerCase();
  if (kw) {
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
    const haystack = [empresa, unidade, a.assunto, a.descricao, a.vinculos, tipos, setores, checklist]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(kw)) return false;
  }
  return true;
}

const PRIORIDADE_RANK: Record<Prioridade, number> = {
  Urgente: 0,
  Importante: 1,
  Médio: 2,
  Baixo: 3,
};

export function sortExecucoes(list: AtividadeGeral[], ordenar: OrderBy): AtividadeGeral[] {
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
