"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade } from "@/lib/types";
import { atividadesHref, matchesActivity, type ActivityFilters } from "@/lib/activity-filters";
import { KpiCard, PRIORIDADE_COLORS, toBarListItems } from "@/components/dashboard/dashboard-shared";
import { BarList } from "@/components/charts/bar-list";

// Campo 3 — Prioridade (Cap. 4, S8).
export function PrioridadeWidget({
  filters,
  atividades,
}: {
  filters: ActivityFilters;
  atividades: Atividade[];
}) {
  const { lookups } = useAppData();
  const router = useRouter();

  const filtered = useMemo(
    () => atividades.filter((a) => matchesActivity(a, filters, lookups)),
    [atividades, filters, lookups]
  );

  const prioridadeOrdem = ["Urgente", "Importante", "Médio", "Baixo"] as const;
  const prioridadeData = prioridadeOrdem.map((p) => ({
    label: p,
    count: filtered.filter((a) => a.prioridade === p).length,
    color: PRIORIDADE_COLORS[p],
  }));
  const prioridadeHrefs = prioridadeOrdem.map((p) => atividadesHref(filters, { prioridades: [p] }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-1 gap-3">
        <KpiCard label="Atividades urgentes" value={filtered.filter((a) => a.prioridade === "Urgente").length} color="var(--prioridade-urgente)" href={atividadesHref(filters, { prioridades: ["Urgente"] })} />
        <KpiCard label="Atividades Importantes" value={filtered.filter((a) => a.prioridade === "Importante").length} color="var(--prioridade-importante)" href={atividadesHref(filters, { prioridades: ["Importante"] })} />
      </div>
      <div className="panel-card flex flex-col gap-3 p-4 lg:col-span-2">
        <span className="ledger-label">Atividades x Prioridade</span>
        <BarList items={toBarListItems(prioridadeData)} onItemClick={(i) => router.push(prioridadeHrefs[i])} />
      </div>
    </div>
  );
}
