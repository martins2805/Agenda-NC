"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import type { Atividade } from "@/lib/types";
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
  const { lookups, atividades, atividadesGerais, loading } = useAppData();
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | null>(null);
  const [view, setView] = useState<ViewMode>("cards");

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
        const assunto = a.assunto;
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
        <div className="flex flex-col gap-2 sm:flex-row">
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
          <Link
            href="/atividades-gerais"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--chart-2)] px-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--chart-2)]/90 sm:w-fit"
          >
            <Plus className="size-4" />
            Nova atividade geral
          </Link>
        </div>
      </div>

      <DashboardStats atividades={filtered} atividadesGerais={atividadesGerais} />

      <ActivityCalendar atividades={atividades} atividadesGerais={atividadesGerais} />

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
      ) : view === "cards" ? (
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
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Unidade</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Assunto</th>
                <th className="px-3 py-2">Prazo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Checklist</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const empresa = lookups.empresa.find((e) => e.id === a.empresaId)?.name ?? "Sem empresa";
                const unidade = lookups.unidade.find((u) => u.id === a.unidadeId)?.name ?? "-";
                const assunto = a.assunto || "-";
                const tipos = lookups.tipoAtividade
                  .filter((t) => a.tipoAtividadeIds.includes(t.id))
                  .map((t) => t.name)
                  .join(", ") || "-";
                const total = a.checklist.length;
                const done = a.checklist.filter((c) => c.concluido).length;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <tr
                    key={a.id}
                    className="cursor-pointer border-t hover:bg-muted/30"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    <td className="px-3 py-2 font-medium">{empresa}</td>
                    <td className="px-3 py-2">{unidade}</td>
                    <td className="px-3 py-2">{tipos}</td>
                    <td className="px-3 py-2">{assunto}</td>
                    <td className="px-3 py-2">{a.prazo ? parseLocalDate(a.prazo).toLocaleDateString("pt-BR") : "-"}</td>
                    <td className="px-3 py-2">{a.status}</td>
                    <td className="px-3 py-2">{a.prioridade}</td>
                    <td className="px-3 py-2">{total ? `${pct}% (${done}/${total})` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
