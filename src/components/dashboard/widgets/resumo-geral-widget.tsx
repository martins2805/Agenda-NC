"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade } from "@/lib/types";
import { atividadesHref, matchesActivity, type ActivityFilters } from "@/lib/activity-filters";
import { KpiCard } from "@/components/dashboard/dashboard-shared";

// Campo 1 — Resumo Geral (Cap. 4, S8). Restrito a Atividades na S15 (D17) —
// Execuções, Registros e Planilhas saíram da interface.
export function ResumoGeralWidget({
  filters,
  atividades,
}: {
  filters: ActivityFilters;
  atividades: Atividade[];
}) {
  const { lookups } = useAppData();

  const filtered = useMemo(
    () => atividades.filter((a) => matchesActivity(a, filters, lookups)),
    [atividades, filters, lookups]
  );

  return (
    <div className="grid grid-cols-1 gap-3">
      <KpiCard label="Total de atividades" value={filtered.length} color="var(--base-1)" href={atividadesHref(filters)} />
    </div>
  );
}
