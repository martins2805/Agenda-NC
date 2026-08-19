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

export type VinculoFilter = "todos" | "vinculado" | "sem_vinculo";

export interface RegistroFilters {
  empresaId: string | null;
  categoriaId: string | null;
  vinculo: VinculoFilter;
  keyword: string;
}

export const DEFAULT_REGISTRO_FILTERS: RegistroFilters = {
  empresaId: null,
  categoriaId: null,
  vinculo: "todos",
  keyword: "",
};

const ALL = "__all__";

interface RegistroFilterBarProps {
  filters: RegistroFilters;
  onChange: (filters: RegistroFilters) => void;
}

export function RegistroFilterBar({ filters, onChange }: RegistroFilterBarProps) {
  const { lookups } = useAppData();

  function patch(p: Partial<RegistroFilters>) {
    onChange({ ...filters, ...p });
  }

  const hasActiveFilters =
    filters.empresaId ||
    filters.categoriaId ||
    filters.vinculo !== "todos" ||
    filters.keyword;

  return (
    <div className="panel-card flex flex-col gap-3 p-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por contato, empresa ou assunto..."
          value={filters.keyword}
          onChange={(e) => patch({ keyword: e.target.value })}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              lookups.categoriaRegistro.filter((c) => c.active).map((c) => [c.id, c.name])
            ),
          }}
          value={filters.categoriaId ?? ALL}
          onValueChange={(v) => patch({ categoriaId: v === ALL ? null : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os tipos</SelectItem>
            {lookups.categoriaRegistro
              .filter((c) => c.active)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          items={{
            todos: "Vínculo: todos",
            vinculado: "Com vínculo",
            sem_vinculo: "Sem vínculo",
          }}
          value={filters.vinculo}
          onValueChange={(v) => patch({ vinculo: v as VinculoFilter })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Vínculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Vínculo: todos</SelectItem>
            <SelectItem value="vinculado">Com vínculo</SelectItem>
            <SelectItem value="sem_vinculo">Sem vínculo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5 text-muted-foreground"
          onClick={() => onChange(DEFAULT_REGISTRO_FILTERS)}
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
