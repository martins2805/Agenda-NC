"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Table2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { FilterBar } from "@/components/atividades/filter-bar";
import { ActivityCalendar } from "@/components/atividades/activity-calendar";
import { ActivityCard } from "@/components/atividades/activity-card";
import { ActivityForm } from "@/components/atividades/activity-form";
import { DashboardAnalytics } from "@/components/atividades/dashboard-analytics";
import {
  DEFAULT_FILTERS,
  matchesActivity,
  sortActivities,
  matchesPrazoRange,
  type ActivityFilters,
} from "@/lib/activity-filters";
import type { Atividade } from "@/lib/types";

export default function DashboardPage() {
  const { atividades, atividadesGerais, registros, planilhas, lookups } = useAppData();
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
    <div className="flex flex-col gap-6">
      {/* Hero Section — saudação, atalhos e resumo rápido */}
      <section className="hero-surface flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-white/70">Agenda NC</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Painel de controle
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Visão viva da operação, com indicadores e calendário.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-1.5 bg-white text-[#1F2C43] hover:bg-white/90" onClick={novaAtividade}>
              <Plus className="size-4" /> Nova Atividade
            </Button>
            <Link href="/atividades-gerais" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-sm font-medium text-white transition-colors hover:bg-white/25">
              <ClipboardCheck className="size-4" /> Nova Execução
            </Link>
            <Link href="/registros" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-sm font-medium text-white transition-colors hover:bg-white/25">
              <FileText className="size-4" /> Registro
            </Link>
            <Link href="/planilhas" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-sm font-medium text-white transition-colors hover:bg-white/25">
              <Table2 className="size-4" /> Planilha
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Atividades", value: filtered.length },
            { label: "Pendentes", value: pendentes },
            { label: "Vencidas", value: vencidas },
            { label: "Execuções", value: atividadesGerais.length },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">{item.label}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Filtros do dashboard (container escuro #1F2C43) */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        showProduto
        dark
        className="panel-card p-4"
      />

      {/* Calendário (independente dos filtros) à esquerda + análise à direita */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(320px,380px)_1fr]">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Calendário</h3>
          <ActivityCalendar atividades={atividades} atividadesGerais={atividadesGerais} />
        </div>
        <DashboardAnalytics
          filters={filters}
          atividades={atividades}
          atividadesGerais={atividadesGerais}
          registros={registros}
          planilhas={planilhas}
        />
      </div>

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
