"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Prioridade, StatusConclusao } from "@/lib/types";

export interface ActivityFilters {
  empresaId: string | null;
  tipoAtividadeId: string | null;
  status: StatusConclusao | null;
  prazo: "todos" | "atrasadas" | "hoje" | "7dias" | "30dias";
  keyword: string;
  prioridade: Prioridade | null;
}

export const DEFAULT_FILTERS: ActivityFilters = {
  empresaId: null,
  tipoAtividadeId: null,
  status: null,
  prazo: "todos",
  keyword: "",
  prioridade: null,
};

const ALL = "__all__";

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
    filters.empresaId ||
    filters.tipoAtividadeId ||
    filters.status ||
    filters.prazo !== "todos" ||
    filters.keyword ||
    filters.prioridade;

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
        <Select
          items={{
            [ALL]: "Todas as empresas",
            ...Object.fromEntries(
              lookups.empresa.filter((e) => e.active).map((e) => [e.id, e.name])
            ),
          }}
          value={filters.empresaId ?? ALL}
          onValueChange={(v) => patch({ empresaId: v === ALL ? null : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as empresas</SelectItem>
            {lookups.empresa
              .filter((e) => e.active)
              .map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          items={{
            [ALL]: "Todos os tipos",
            ...Object.fromEntries(
              lookups.tipoAtividade.filter((t) => t.active).map((t) => [t.id, t.name])
            ),
          }}
          value={filters.tipoAtividadeId ?? ALL}
          onValueChange={(v) => patch({ tipoAtividadeId: v === ALL ? null : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os tipos</SelectItem>
            {lookups.tipoAtividade
              .filter((t) => t.active)
              .map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          items={{ [ALL]: "Todos os status", ...Object.fromEntries(STATUS_OPTIONS.map((s) => [s, s])) }}
          value={filters.status ?? ALL}
          onValueChange={(v) => patch({ status: v === ALL ? null : (v as StatusConclusao) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{
            [ALL]: "Todas as prioridades",
            ...Object.fromEntries(PRIORIDADE_OPTIONS.map((p) => [p, p])),
          }}
          value={filters.prioridade ?? ALL}
          onValueChange={(v) => patch({ prioridade: v === ALL ? null : (v as Prioridade) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as prioridades</SelectItem>
            {PRIORIDADE_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={{
            todos: "Qualquer prazo",
            atrasadas: "Atrasadas",
            hoje: "Vencem hoje",
            "7dias": "Próximos 7 dias",
            "30dias": "Próximos 30 dias",
          }}
          value={filters.prazo}
          onValueChange={(v) => patch({ prazo: v as ActivityFilters["prazo"] })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Qualquer prazo</SelectItem>
            <SelectItem value="atrasadas">Atrasadas</SelectItem>
            <SelectItem value="hoje">Vencem hoje</SelectItem>
            <SelectItem value="7dias">Próximos 7 dias</SelectItem>
            <SelectItem value="30dias">Próximos 30 dias</SelectItem>
          </SelectContent>
        </Select>
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
