import { STATUS_FROM_DB, PRIORIDADE_FROM_DB } from "./atividade-mapper";
import { matchesRecord, type FilterableRecord } from "./filters/engine";
import type { PrazoRange } from "./filters/types";
import { STATUS_OPTIONS, STATUS_GERAL_OPTIONS } from "./types";
import type { Prioridade } from "./types";

export type { PrazoRange } from "./filters/types";
export { PRAZO_OPTIONS } from "./filters/types";

// Adapter fino sobre o motor único de filtros (src/lib/filters/engine.ts),
// mesmo padrão de src/lib/activity-filters.ts — nenhuma lógica de filtro nova.

// Forma crua devolvida por GET /api/prazos (view prazo_unificado, S1/S7).
export interface PrazoUnificadoApiRow {
  objetoTipo: string; // "atividade" | "atividadeGeral"
  objetoId: string;
  origemTipo: string; // "atividade" | "checklist" | "proposta"
  origemId: string;
  titulo: string;
  empresaId: string | null;
  unidadeId: string | null;
  data: string; // "YYYY-MM-DDTHH:mm"
  prioridade: string; // enum cru do banco (ex.: "Medio")
  status: string; // enum cru do banco (ex.: "AguardandoRetornoInterno")
  tipoPrazo: string;
  tipoAtividadeIds: string[];
}

// Mesma linha, com status/prioridade já traduzidos para o rótulo exibido —
// a view devolve o enum cru via `::text`, sem os acentos/nomes de exibição.
export interface PrazoEntry extends Omit<PrazoUnificadoApiRow, "prioridade" | "status"> {
  prioridade: Prioridade;
  status: string;
}

export function prazoEntryFromApi(row: PrazoUnificadoApiRow): PrazoEntry {
  return {
    ...row,
    prioridade: PRIORIDADE_FROM_DB[row.prioridade as keyof typeof PRIORIDADE_FROM_DB] ?? (row.prioridade as Prioridade),
    // AtividadeGeral/ChecklistGeralItem já gravam o status como texto de exibição
    // (StatusGeral não é enum no banco) — só o lado Atividade precisa de tradução.
    status:
      row.objetoTipo === "atividade"
        ? STATUS_FROM_DB[row.status as keyof typeof STATUS_FROM_DB] ?? row.status
        : row.status,
  };
}

export function tipoPrazoLabel(entry: Pick<PrazoEntry, "objetoTipo" | "tipoPrazo">): string {
  if (entry.tipoPrazo === "proposta") return "Proposta";
  if (entry.tipoPrazo === "checklist") {
    return entry.objetoTipo === "atividadeGeral" ? "Checklist (Execução)" : "Checklist (Atividade)";
  }
  return entry.objetoTipo === "atividadeGeral" ? "Execução" : "Atividade";
}

export interface CalendarFilters {
  keyword: string;
  empresaIds: string[];
  unidadeIds: string[];
  tipoAtividadeIds: string[];
  status: string[];
  prioridades: Prioridade[];
  prazos: PrazoRange[];
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  keyword: "",
  empresaIds: [],
  unidadeIds: [],
  tipoAtividadeIds: [],
  status: [],
  prioridades: [],
  prazos: [],
};

// União dos status de Atividade (StatusConclusao) e de Execução (StatusGeral)
// — o calendário mistura as duas origens, então o filtro precisa cobrir ambas.
export const CALENDAR_STATUS_OPTIONS: string[] = [
  ...new Set<string>([...STATUS_OPTIONS, ...STATUS_GERAL_OPTIONS]),
];

interface Lookups {
  empresa: { id: string; name: string }[];
  unidade: { id: string; name: string }[];
}

function toRecord(entry: PrazoEntry, lookups: Lookups): FilterableRecord {
  const empresa = lookups.empresa.find((e) => e.id === entry.empresaId)?.name ?? "";
  const unidade = lookups.unidade.find((u) => u.id === entry.unidadeId)?.name ?? "";
  return {
    empresaId: entry.empresaId,
    unidadeId: entry.unidadeId,
    tipoIds: entry.tipoAtividadeIds,
    status: entry.status,
    prioridade: entry.prioridade,
    prazo: entry.data,
    createdAt: entry.data,
    searchText: [empresa, unidade, entry.titulo, entry.status, entry.prioridade].join(" "),
  };
}

export function matchesPrazoEntry(entry: PrazoEntry, filters: CalendarFilters, lookups: Lookups): boolean {
  return matchesRecord(toRecord(entry, lookups), {
    keyword: filters.keyword,
    empresaIds: filters.empresaIds,
    unidadeIds: filters.unidadeIds,
    tipoIds: filters.tipoAtividadeIds,
    status: filters.status,
    prioridades: filters.prioridades,
    prazos: filters.prazos,
  });
}

export function hasActiveCalendarFilters(filters: CalendarFilters): boolean {
  return (
    filters.keyword.trim() !== "" ||
    filters.empresaIds.length > 0 ||
    filters.unidadeIds.length > 0 ||
    filters.tipoAtividadeIds.length > 0 ||
    filters.status.length > 0 ||
    filters.prioridades.length > 0 ||
    filters.prazos.length > 0
  );
}
