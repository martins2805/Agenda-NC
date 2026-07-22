import type { Prioridade } from "../types";
import { matchesPrazos } from "./prazo";
import type { OrderBy, PrazoRange } from "./types";

// Motor de filtros único (regra 3 do CLAUDE.md). Atividade e AtividadeGeral
// convergem para este formato via um adapter (ver activity-filters.ts /
// execucao-filters.ts) — toda filtragem de verdade acontece aqui, uma vez só,
// para que contagem e listagem nunca possam divergir (é sempre o mesmo
// `.length` sobre o mesmo array filtrado).

export interface FilterableRecord {
  empresaId: string | null;
  unidadeId: string | null;
  tipoIds: string[];
  status: string;
  prioridade: Prioridade;
  prazo: string | null;
  createdAt: string;
  searchText: string;
}

export interface EngineFilters {
  keyword: string;
  empresaIds: string[];
  unidadeIds: string[];
  tipoIds: string[];
  status: string[];
  prioridades: Prioridade[];
  prazos: PrazoRange[];
}

export function matchesRecord(record: FilterableRecord, filters: EngineFilters): boolean {
  if (filters.empresaIds.length > 0 && !(record.empresaId && filters.empresaIds.includes(record.empresaId)))
    return false;
  if (filters.unidadeIds.length > 0 && !(record.unidadeId && filters.unidadeIds.includes(record.unidadeId)))
    return false;
  if (filters.tipoIds.length > 0 && !filters.tipoIds.some((id) => record.tipoIds.includes(id)))
    return false;
  if (filters.status.length > 0 && !filters.status.includes(record.status)) return false;
  if (filters.prioridades.length > 0 && !filters.prioridades.includes(record.prioridade)) return false;
  if (!matchesPrazos(record.prazo, filters.prazos)) return false;

  const keyword = filters.keyword.trim().toLowerCase();
  if (keyword && !record.searchText.toLowerCase().includes(keyword)) return false;

  return true;
}

const PRIORIDADE_RANK: Record<Prioridade, number> = {
  Urgente: 0,
  Importante: 1,
  Médio: 2,
  Baixo: 3,
};

export function sortRecords<T>(
  list: T[],
  ordenar: OrderBy,
  toRecord: (item: T) => Pick<FilterableRecord, "prazo" | "prioridade" | "createdAt">
): T[] {
  const copy = [...list];
  if (ordenar === "prazo") {
    copy.sort((a, b) => {
      const pa = toRecord(a).prazo;
      const pb = toRecord(b).prazo;
      if (!pa && !pb) return 0;
      if (!pa) return 1;
      if (!pb) return -1;
      return pa.localeCompare(pb);
    });
  } else if (ordenar === "prioridade") {
    copy.sort((a, b) => PRIORIDADE_RANK[toRecord(a).prioridade] - PRIORIDADE_RANK[toRecord(b).prioridade]);
  } else {
    copy.sort((a, b) => toRecord(b).createdAt.localeCompare(toRecord(a).createdAt));
  }
  return copy;
}
