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
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS, STATUS_NEGOCIACAO_LABELS } from "@/lib/types";
import type { Prioridade, StatusConclusao, StatusNegociacao } from "@/lib/types";
import {
  DEFAULT_FILTERS,
  PRAZO_OPTIONS,
  PRODUTO_TIPO_OPTIONS,
  ORDER_OPTIONS,
  hasActiveFilters,
  type ActivityFilters,
  type OrderBy,
} from "@/lib/activity-filters";

// Re-export para preservar imports existentes.
export { DEFAULT_FILTERS };
export type { ActivityFilters };
export type PrazoRange = ActivityFilters["prazos"][number];

interface FilterBarProps {
  filters: ActivityFilters;
  onChange: (filters: ActivityFilters) => void;
  /** Exibe filtros de produto/serviço (dashboard e atividades). Default true. */
  showProduto?: boolean;
  /** Exibe o seletor "ordenar por" (telas de lista). Default false. */
  showOrder?: boolean;
  /** Classe extra para o container (ex.: fundo escuro no dashboard). */
  className?: string;
  /** true quando o container é escuro, ajusta a cor do texto/label. */
  dark?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  showProduto = true,
  showOrder = false,
  className,
  dark = false,
}: FilterBarProps) {
  const { lookups } = useAppData();

  function patch(p: Partial<ActivityFilters>) {
    onChange({ ...filters, ...p });
  }

  const empresaOptions = lookups.empresa
    .filter((e) => e.active)
    .map((e) => ({ value: e.id, label: e.name }));
  const unidadeOptions = lookups.unidade
    .filter((u) => u.active)
    .filter((u) => filters.empresaIds.length === 0 || (u.empresaId && filters.empresaIds.includes(u.empresaId)))
    .map((u) => ({ value: u.id, label: u.name }));
  const tipoOptions = lookups.tipoAtividade
    .filter((t) => t.active)
    .map((t) => ({ value: t.id, label: t.name }));
  const servicoOptions = lookups.servicoProduto
    .filter((s) => s.active)
    .map((s) => ({ value: s.id, label: s.name }));
  const statusOptions = STATUS_OPTIONS.map((s) => ({ value: s, label: s }));
  const prioridadeOptions = PRIORIDADE_OPTIONS.map((p) => ({ value: p, label: p }));
  const statusNegociacaoOptions = Object.entries(STATUS_NEGOCIACAO_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const wrapper = className ?? "panel-card p-3";

  return (
    <div className={`flex flex-col gap-3 ${wrapper}`}>
      <div className="relative">
        <Search className={`absolute left-2.5 top-1/2 size-4 -translate-y-1/2 ${dark ? "text-white/60" : "text-muted-foreground"}`} />
        <Input
          placeholder="Buscar por palavra-chave em todos os campos..."
          value={filters.keyword}
          onChange={(e) => patch({ keyword: e.target.value })}
          className={`pl-8 ${dark ? "border-white/15 bg-white/10 text-white placeholder:text-white/50" : ""}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <FilterMultiSelect
          placeholder="Empresa"
          options={empresaOptions}
          value={filters.empresaIds}
          onChange={(empresaIds) => patch({ empresaIds })}
        />
        <FilterMultiSelect
          placeholder="Unidade"
          options={unidadeOptions}
          value={filters.unidadeIds}
          onChange={(unidadeIds) => patch({ unidadeIds })}
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
          onChange={(prazos) => patch({ prazos: prazos as ActivityFilters["prazos"] })}
        />
        {showProduto && (
          <>
            <FilterMultiSelect
              placeholder="Tipo produto/serviço"
              options={PRODUTO_TIPO_OPTIONS}
              value={filters.produtoTipos}
              onChange={(produtoTipos) => patch({ produtoTipos })}
            />
            <FilterMultiSelect
              placeholder="Produto/serviço"
              options={servicoOptions}
              value={filters.servicoProdutoIds}
              onChange={(servicoProdutoIds) => patch({ servicoProdutoIds })}
            />
            <FilterMultiSelect
              placeholder="Status de negociação"
              options={statusNegociacaoOptions}
              value={filters.statusNegociacao}
              onChange={(statusNegociacao) => patch({ statusNegociacao: statusNegociacao as StatusNegociacao[] })}
            />
          </>
        )}
        {showOrder && (
          <div className="col-span-2 sm:col-span-1">
            <Select
              value={filters.ordenar}
              onValueChange={(v) => patch({ ordenar: v as OrderBy })}
            >
              <SelectTrigger className="w-full gap-1.5">
                <ArrowDownUp className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    Ordenar: {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {hasActiveFilters(filters) && (
        <Button
          variant="ghost"
          size="sm"
          className={`w-fit gap-1.5 ${dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-muted-foreground"}`}
          onClick={() => onChange({ ...DEFAULT_FILTERS, ordenar: filters.ordenar })}
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
