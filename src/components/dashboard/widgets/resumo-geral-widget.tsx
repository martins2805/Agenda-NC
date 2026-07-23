"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade, AtividadeGeral, Planilha, Registro } from "@/lib/types";
import { atividadesHref, execucoesHref, matchesActivity, simpleHref, type ActivityFilters } from "@/lib/activity-filters";
import { KpiCard } from "@/components/dashboard/dashboard-shared";

// Campo 1 — Resumo Geral (Cap. 4, S8).
export function ResumoGeralWidget({
  filters,
  atividades,
  atividadesGerais,
  registros,
  planilhas,
}: {
  filters: ActivityFilters;
  atividades: Atividade[];
  atividadesGerais: AtividadeGeral[];
  registros: Registro[];
  planilhas: Planilha[];
}) {
  const { lookups } = useAppData();

  const filtered = useMemo(
    () => atividades.filter((a) => matchesActivity(a, filters, lookups)),
    [atividades, filters, lookups]
  );

  const execucoesFiltered = useMemo(() => {
    return atividadesGerais.filter((a) => {
      if (filters.empresaIds.length > 0 && !(a.empresaId && filters.empresaIds.includes(a.empresaId))) return false;
      if (filters.unidadeIds.length > 0 && !(a.unidadeId && filters.unidadeIds.includes(a.unidadeId))) return false;
      if (filters.prioridades.length > 0 && !filters.prioridades.includes(a.prioridade)) return false;
      const kw = filters.keyword.trim().toLowerCase();
      if (kw && !a.assunto.toLowerCase().includes(kw) && !a.descricao.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [atividadesGerais, filters]);

  const registrosFiltered = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return registros.filter((r) => {
      if (r.deletedAt) return false;
      if (filters.empresaIds.length > 0 && !(r.empresaId && filters.empresaIds.includes(r.empresaId))) return false;
      if (kw) {
        const empresa = lookups.empresa.find((e) => e.id === r.empresaId)?.name ?? "";
        if (![r.nome, r.assunto, r.contato, empresa].join(" ").toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [registros, filters, lookups]);

  const planilhasFiltered = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return planilhas.filter((p) => {
      if (p.deletedAt) return false;
      if (filters.empresaIds.length > 0 && !(p.empresaId && filters.empresaIds.includes(p.empresaId))) return false;
      if (kw) {
        const empresa = lookups.empresa.find((e) => e.id === p.empresaId)?.name ?? "";
        if (![p.nome, p.assunto, empresa].join(" ").toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [planilhas, filters, lookups]);

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <KpiCard label="Total de atividades" value={filtered.length} color="var(--base-1)" href={atividadesHref(filters)} />
      <KpiCard label="Total de execuções" value={execucoesFiltered.length} color="var(--base-2)" href={execucoesHref(filters)} />
      <KpiCard label="Total de registros" value={registrosFiltered.length} color="var(--base-3)" href={simpleHref("/registros", filters)} />
      <KpiCard label="Total de planilhas" value={planilhasFiltered.length} color="var(--base-3)" href={simpleHref("/planilhas", filters)} />
    </div>
  );
}
