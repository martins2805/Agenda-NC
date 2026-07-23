"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade } from "@/lib/types";
import { atividadesHref, matchesActivity, type ActivityFilters } from "@/lib/activity-filters";
import { KpiCard, isOverdue, statusBuckets, vencimentoBuckets, toBarListItems } from "@/components/dashboard/dashboard-shared";
import { BarList } from "@/components/charts/bar-list";

// Campo 2 — Status (Cap. 4, S8).
export function StatusWidget({
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

  const total = filtered.length;
  const concluidas = filtered.filter((a) => a.status === "Concluído").length;
  const indiceConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const statusHrefs = [
    atividadesHref(filters, { status: ["Pendente"] }),
    atividadesHref(filters, { status: ["Aguardando retorno interno", "Aguardando retorno cliente"] }),
    atividadesHref(filters, { status: ["Concluído"] }),
  ];
  const vencimentoHrefs = [
    atividadesHref(filters, { prazos: ["atrasadas"] }),
    atividadesHref(filters, { prazos: ["hoje"] }),
    atividadesHref(filters, { prazos: ["7dias"] }),
    atividadesHref(filters, { prazos: ["30dias"] }),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Índice de Conclusão Atividades" value={`${indiceConclusao}%`} color="var(--base-2)" href={atividadesHref(filters)} />
        <KpiCard label="Atividades Pendentes" value={filtered.filter((a) => a.status === "Pendente").length} color="var(--status-pendente)" href={atividadesHref(filters, { status: ["Pendente"] })} />
        <KpiCard label="Atividades Vencidas" value={filtered.filter(isOverdue).length} color="var(--prazo-proximo)" href={atividadesHref(filters, { prazos: ["atrasadas"] })} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel-card flex flex-col gap-3 p-4">
          <span className="ledger-label">Status de Conclusão</span>
          <BarList
            items={toBarListItems(statusBuckets(filtered))}
            onItemClick={(i) => router.push(statusHrefs[i])}
          />
        </div>
        <div className="panel-card flex flex-col gap-3 p-4">
          <span className="ledger-label">Status de vencimento</span>
          <BarList
            items={toBarListItems(vencimentoBuckets(filtered))}
            onItemClick={(i) => router.push(vencimentoHrefs[i])}
          />
        </div>
      </div>
    </div>
  );
}
