"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { useAutoOpenFromQuery } from "@/lib/use-auto-open";
import { FilterBar } from "@/components/atividades/filter-bar";
import { ActivityCard } from "@/components/atividades/activity-card";
import { ActivityTable } from "@/components/atividades/activity-table";
import { ActivityForm } from "@/components/atividades/activity-form";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import {
  DEFAULT_FILTERS,
  matchesActivity,
  sortActivities,
  paramsToFilters,
  type ActivityFilters,
} from "@/lib/activity-filters";
import type { Atividade } from "@/lib/types";

function initialFilters(): ActivityFilters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  return paramsToFilters(new URLSearchParams(window.location.search));
}

export default function AtividadesPage() {
  const { lookups, atividades, loading } = useAppData();
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | null>(null);
  const [view, setView] = useState<ViewMode>("cards");

  useAutoOpenFromQuery(atividades, loading, (a) => {
    setEditing(a);
    setFormOpen(true);
  });

  const filtered = useMemo(() => {
    const list = atividades.filter((a) => matchesActivity(a, filters, lookups));
    return sortActivities(list, filters.ordenar);
  }, [atividades, filters, lookups]);

  function openEdit(a: Atividade) {
    setEditing(a);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Atividades</h2>
          <p className="mt-1 text-muted-foreground">
            Filtros combinados, ordenação e conclusão direta na lista.
          </p>
        </div>
        <Button
          className="gap-2 sm:w-fit"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova atividade
        </Button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} showProduto showOrder />
      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
          <ListChecks className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            {atividades.length === 0
              ? "Nenhuma atividade cadastrada ainda."
              : "Nenhuma atividade encontrada com esses filtros."}
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <ActivityCard key={a.id} atividade={a} onEdit={() => openEdit(a)} />
          ))}
        </div>
      ) : (
        <ActivityTable atividades={filtered} onEdit={openEdit} />
      )}

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
