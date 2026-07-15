"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, ArrowDownUp } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_GERAL_OPTIONS } from "@/lib/types";
import type { Prioridade, StatusGeral } from "@/lib/types";
import { PRAZO_OPTIONS, ORDER_OPTIONS, type OrderBy } from "@/lib/activity-filters";
import {
  DEFAULT_EXECUCAO_FILTERS,
  hasActiveExecucaoFilters,
  type ExecucaoFilters,
} from "@/lib/execucao-filters";

export function ExecucaoFilterBar({
  filters,
  onChange,
}: {
  filters: ExecucaoFilters;
  onChange: (f: ExecucaoFilters) => void;
}) {
  const { lookups } = useAppData();

  function patch(p: Partial<ExecucaoFilters>) {
    onChange({ ...filters, ...p });
  }

  const empresaOptions = lookups.empresa.filter((e) => e.active).map((e) => ({ value: e.id, label: e.name }));
  const unidadeOptions = lookups.unidade
    .filter((u) => u.active)
    .filter((u) => filters.empresaIds.length === 0 || (u.empresaId && filters.empresaIds.includes(u.empresaId)))
    .map((u) => ({ value: u.id, label: u.name }));
  const tipoOptions = lookups.tipoAtividadeGeral.filter((t) => t.active).map((t) => ({ value: t.id, label: t.name }));
  const statusOptions = STATUS_GERAL_OPTIONS.map((s) => ({ value: s, label: s }));
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <FilterMultiSelect placeholder="Empresa" options={empresaOptions} value={filters.empresaIds} onChange={(empresaIds) => patch({ empresaIds })} />
        <FilterMultiSelect placeholder="Unidade" options={unidadeOptions} value={filters.unidadeIds} onChange={(unidadeIds) => patch({ unidadeIds })} />
        <FilterMultiSelect placeholder="Tipo" options={tipoOptions} value={filters.tipoIds} onChange={(tipoIds) => patch({ tipoIds })} />
        <FilterMultiSelect placeholder="Status" options={statusOptions} value={filters.status} onChange={(status) => patch({ status: status as StatusGeral[] })} />
        <FilterMultiSelect placeholder="Prioridade" options={prioridadeOptions} value={filters.prioridades} onChange={(prioridades) => patch({ prioridades: prioridades as Prioridade[] })} />
        <FilterMultiSelect placeholder="Prazo" options={PRAZO_OPTIONS} value={filters.prazos} onChange={(prazos) => patch({ prazos: prazos as ExecucaoFilters["prazos"] })} />
        <Select value={filters.ordenar} onValueChange={(v) => patch({ ordenar: v as OrderBy })}>
          <SelectTrigger className="w-full gap-1.5">
            <ArrowDownUp className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>Ordenar: {o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasActiveExecucaoFilters(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 text-muted-foreground"
          onClick={() => onChange({ ...DEFAULT_EXECUCAO_FILTERS, ordenar: filters.ordenar })}
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
