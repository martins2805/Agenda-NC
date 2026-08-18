"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { FilterBar } from "@/components/atividades/filter-bar";
import { ActivityCalendar } from "@/components/atividades/activity-calendar";
import { ActivityCard } from "@/components/atividades/activity-card";
import { ActivityForm } from "@/components/atividades/activity-form";
import { DashboardAnalytics, VisaoGeralWidget } from "@/components/atividades/dashboard-analytics";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { WidgetConfigPanel } from "@/components/dashboard/widget-config-panel";
import {
  DEFAULT_FILTERS,
  matchesActivity,
  sortActivities,
  matchesPrazoRange,
  type ActivityFilters,
} from "@/lib/activity-filters";
import type { Atividade } from "@/lib/types";

export default function DashboardPage() {
  const { atividades, lookups } = useAppData();
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | null>(null);

  const filtered = useMemo(
    () => atividades.filter((a) => matchesActivity(a, filters, lookups)),
    [atividades, filters, lookups]
  );

  const pendentes = filtered.filter((a) => a.status === "Pendente").length;
  const vencidas = filtered.filter(
    (a) => a.status !== "Concluído" && matchesPrazoRange(a.prazo, "atrasadas")
  ).length;

  const recentes = useMemo(
    () => sortActivities(filtered, "criacao").slice(0, 6),
    [filtered]
  );

  function novaAtividade() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho estilo iOS "Large Title" (D18, harness v6): o título vive
          direto sobre o wallpaper — sem laje de hero — com as ações em vidro
          à direita e o resumo rápido em chips-pílula de vidro, números nas
          cores semânticas de sempre (D8). Mesmo conteúdo do hero anterior,
          só a apresentação mudou. */}
      <section className="flex flex-col gap-4 px-1 pt-1">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Agenda NC</p>
            <h2 className="mt-0.5 text-3xl font-bold tracking-tight sm:text-4xl">
              Painel de controle
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Visão viva da operação, com indicadores e calendário.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-1.5" onClick={novaAtividade}>
              <Plus className="size-4" /> Nova Atividade
            </Button>
            <WidgetConfigPanel />
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {[
            { label: "Atividades", value: filtered.length, cor: "var(--foreground)" },
            { label: "Pendentes", value: pendentes, cor: "var(--status-pendente)" },
            { label: "Vencidas", value: vencidas, cor: "var(--prazo-proximo)" },
          ].map((item) => (
            <div key={item.label} className="glass-pill flex items-baseline gap-2 border px-4 py-2">
              <span className="font-mono text-lg font-bold" style={{ color: item.cor }}>
                {item.value}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Filtros do dashboard em vidro claro com TEXTO ESCURO — o modo `dark`
          (texto branco, da época do container sólido #1F2C43) saiu junto com
          a laje escura: feedback do usuário em 2026-08-17, a laje pesada não
          parecia vidro e o texto branco sumia sobre vidro claro. */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        showProduto
        className="panel-card p-4"
      />

      {/* Indicadores/gráficos à esquerda e ao centro (Área 2) + calendário fixo
          à direita (Área 3), independente dos filtros do dashboard — D2/D3 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(320px,380px)]">
        <div className="flex flex-col gap-6">
          {/* Campos 1-3 (S8) — motor de widgets: ordem/visibilidade/tamanho
              configuráveis no botão de engrenagem do cabeçalho */}
          <DashboardWidgets filters={filters} atividades={atividades} />
          {/* Campos 4-5 (S9) — ainda fora do motor de widgets */}
          <DashboardAnalytics filters={filters} atividades={atividades} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Calendário</h3>
          <ActivityCalendar />
        </div>
      </div>

      {/* Campo 6 — Visão geral, largura total, ao final da página (Cap. 4) */}
      <VisaoGeralWidget filters={filters} atividades={atividades} />

      {/* Atividades recentes — largura total */}
      {recentes.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Atividades recentes
            </h3>
            <Link href="/atividades" className="text-sm font-medium text-[var(--base-1)] hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentes.map((a) => (
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
        </section>
      )}

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
