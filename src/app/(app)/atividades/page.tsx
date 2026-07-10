"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { useAutoOpenFromQuery } from "@/lib/use-auto-open";
import { DashboardStats } from "@/components/atividades/dashboard-stats";
import { ActivityCalendar } from "@/components/atividades/activity-calendar";
import {
  FilterBar,
  DEFAULT_FILTERS,
  type ActivityFilters,
} from "@/components/atividades/filter-bar";
import { ActivityCard } from "@/components/atividades/activity-card";
import { ActivityForm } from "@/components/atividades/activity-form";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { KanbanBoard } from "@/components/kanban-board";
import { STATUS_OPTIONS } from "@/lib/types";
import type { Atividade, StatusConclusao } from "@/lib/types";
import { parseLocalDate } from "@/lib/calculations";

function matchesPrazo(prazo: string | null, mode: ActivityFilters["prazo"]) {
  if (mode === "todos") return true;
  if (!prazo) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseLocalDate(prazo);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (mode === "atrasadas") return diffDays < 0;
  if (mode === "hoje") return diffDays === 0;
  if (mode === "7dias") return diffDays >= 0 && diffDays <= 7;
  if (mode === "30dias") return diffDays >= 0 && diffDays <= 30;
  return true;
}

export default function AtividadesPage() {
  const { lookups, atividades, loading, updateAtividade } = useAppData();
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | null>(null);
  const [view, setView] = useState<ViewMode>("lista");

  useAutoOpenFromQuery(atividades, loading, (a) => {
    setEditing(a);
    setFormOpen(true);
  });

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return atividades.filter((a) => {
      if (filters.empresaId && a.empresaId !== filters.empresaId) return false;
      if (
        filters.tipoAtividadeId &&
        !a.tipoAtividadeIds.includes(filters.tipoAtividadeId)
      )
        return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.prioridade && a.prioridade !== filters.prioridade) return false;
      if (!matchesPrazo(a.prazo, filters.prazo)) return false;

      if (keyword) {
        const empresa = lookups.empresa.find((e) => e.id === a.empresaId)?.name ?? "";
        const unidade = lookups.unidade.find((u) => u.id === a.unidadeId)?.name ?? "";
        const assunto = lookups.assunto.find((s) => s.id === a.assuntoId)?.name ?? "";
        const tipos = lookups.tipoAtividade
          .filter((t) => a.tipoAtividadeIds.includes(t.id))
          .map((t) => t.name)
          .join(" ");
        const checklist = a.checklist.map((c) => c.texto).join(" ");
        const haystack = [
          empresa,
          unidade,
          assunto,
          tipos,
          a.contato,
          a.descricao,
          a.emailConteudo,
          a.oportunidadeTexto,
          a.status,
          a.prioridade,
          checklist,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [atividades, filters, lookups]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-muted-foreground">
            Filtros combinados, indicadores e visão rápida da operação.
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

      <DashboardStats atividades={atividades} />

      <ActivityCalendar atividades={atividades} />

      <FilterBar filters={filters} onChange={setFilters} />
      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <LayoutDashboard className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            {atividades.length === 0
              ? "Nenhuma atividade cadastrada ainda."
              : "Nenhuma atividade encontrada com esses filtros."}
          </p>
        </div>
      ) : view === "lista" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <ActivityCard
              key={a.id}
              atividade={a}
              onEdit={() => {
                setEditing(a);
                setFormOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <KanbanBoard
          columns={STATUS_OPTIONS.map((status) => ({
            id: status,
            name: status,
            items: filtered.filter((a) => a.status === status),
          }))}
          renderCard={(a) => (
            <ActivityCard
              atividade={a}
              onEdit={() => {
                setEditing(a);
                setFormOpen(true);
              }}
            />
          )}
          onMove={(itemId, _fromStatus, toStatus) =>
            updateAtividade(itemId, { status: toStatus as StatusConclusao })
          }
        />
      )}

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
