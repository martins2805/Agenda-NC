"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { Search, X } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Prioridade, StatusConclusao } from "@/lib/types";

export type PrazoRange = "atrasadas" | "hoje" | "7dias" | "30dias";

export interface ActivityFilters {
  empresaIds: string[];
  tipoAtividadeIds: string[];
  status: StatusConclusao[];
  prazos: PrazoRange[];
  keyword: string;
  prioridades: Prioridade[];
}

export const DEFAULT_FILTERS: ActivityFilters = {
  empresaIds: [],
  tipoAtividadeIds: [],
  status: [],
  prazos: [],
  keyword: "",
  prioridades: [],
};

const PRAZO_OPTIONS: { value: PrazoRange; label: string }[] = [
  { value: "atrasadas", label: "Atrasadas" },
  { value: "hoje", label: "Vencem hoje" },
  { value: "7dias", label: "Próximos 7 dias" },
  { value: "30dias", label: "Próximos 30 dias" },
];

interface FilterBarProps {
  filters: ActivityFilters;
  onChange: (filters: ActivityFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { lookups } = useAppData();

  function patch(p: Partial<ActivityFilters>) {
    onChange({ ...filters, ...p });
  }

  const hasActiveFilters =
    filters.empresaIds.length > 0 ||
    filters.tipoAtividadeIds.length > 0 ||
    filters.status.length > 0 ||
    filters.prazos.length > 0 ||
    filters.keyword ||
    filters.prioridades.length > 0;

  const empresaOptions = lookups.empresa
    .filter((e) => e.active)
    .map((e) => ({ value: e.id, label: e.name }));
  const tipoOptions = lookups.tipoAtividade
    .filter((t) => t.active)
    .map((t) => ({ value: t.id, label: t.name }));
  const statusOptions = STATUS_OPTIONS.map((s) => ({ value: s, label: s }));
  const prioridadeOptions = PRIORIDADE_OPTIONS.map((p) => ({ value: p, label: p }));

  return (
    <div className="panel-card flex flex-col gap-3 p-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por palavra-chave em todos os campos..."
          value={filters.keyword}
          onChange={(e) => patch({ keyword: e.target.value })}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <FilterMultiSelect
          placeholder="Empresa"
          options={empresaOptions}
          value={filters.empresaIds}
          onChange={(empresaIds) => patch({ empresaIds })}
        />
        <FilterMultiSelect
          placeholder="Tipo"
          options={tipoOptions}
          value={filters.tipoAtividadeIds}
          onChange={(tipoAtividadeIds) => patch({ tipoAtividadeIds })}
        />
        <FilterMultiSelect
          placeholder="Status"
          options={statusOptions}
          value={filters.status}
          onChange={(status) => patch({ status: status as StatusConclusao[] })}
        />
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
          onChange={(prazos) => patch({ prazos: prazos as PrazoRange[] })}
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 text-muted-foreground"
          onClick={() => onChange(DEFAULT_FILTERS)}
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
