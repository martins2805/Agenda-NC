"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { Search, X } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS } from "@/lib/types";
import type { Prioridade } from "@/lib/types";
import {
  DEFAULT_CALENDAR_FILTERS,
  PRAZO_OPTIONS,
  CALENDAR_STATUS_OPTIONS,
  hasActiveCalendarFilters,
  type CalendarFilters,
} from "@/lib/prazo-filters";

// Filtros próprios do calendário — independentes dos filtros do dashboard
// (Cap. 4 da spec: "o calendário não refletirá os filtros aplicados ao
// dashboard, devendo ter o seu próprio campo de filtros").
export function CalendarFilterBar({
  filters,
  onChange,
}: {
  filters: CalendarFilters;
  onChange: (filters: CalendarFilters) => void;
}) {
  const { lookups } = useAppData();

  function patch(p: Partial<CalendarFilters>) {
    onChange({ ...filters, ...p });
  }

  const empresaOptions = lookups.empresa.filter((e) => e.active).map((e) => ({ value: e.id, label: e.name }));
  const unidadeOptions = lookups.unidade
    .filter((u) => u.active)
    .filter((u) => filters.empresaIds.length === 0 || (u.empresaId && filters.empresaIds.includes(u.empresaId)))
    .map((u) => ({ value: u.id, label: u.name }));
  const tipoOptions = lookups.tipoAtividade.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }));
  const statusOptions = CALENDAR_STATUS_OPTIONS.map((s) => ({ value: s, label: s }));
  const prioridadeOptions = PRIORIDADE_OPTIONS.map((p) => ({ value: p, label: p }));

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar no calendário..."
          value={filters.keyword}
          onChange={(e) => patch({ keyword: e.target.value })}
          className="h-8 pl-7 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <FilterMultiSelect placeholder="Empresa" options={empresaOptions} value={filters.empresaIds} onChange={(empresaIds) => patch({ empresaIds })} />
        <FilterMultiSelect placeholder="Unidade" options={unidadeOptions} value={filters.unidadeIds} onChange={(unidadeIds) => patch({ unidadeIds })} />
        <FilterMultiSelect placeholder="Tipo" options={tipoOptions} value={filters.tipoAtividadeIds} onChange={(tipoAtividadeIds) => patch({ tipoAtividadeIds })} />
        <FilterMultiSelect placeholder="Status" options={statusOptions} value={filters.status} onChange={(status) => patch({ status })} />
        <FilterMultiSelect
          placeholder="Prioridade"
          options={prioridadeOptions}
          value={filters.prioridades}
          onChange={(prioridades) => patch({ prioridades: prioridades as Prioridade[] })}
        />
        <FilterMultiSelect
          placeholder="Prazo"
          options={PRAZO_OPTIONS}
          value={filters.prazos}
          onChange={(prazos) => patch({ prazos: prazos as CalendarFilters["prazos"] })}
        />
      </div>
      {hasActiveCalendarFilters(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 text-muted-foreground"
          onClick={() => onChange(DEFAULT_CALENDAR_FILTERS)}
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
