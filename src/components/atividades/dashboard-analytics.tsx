"use client";

import { useAppData } from "@/lib/app-data-context";
import type { Atividade } from "@/lib/types";
import { atividadesHref, matchesActivity, type ActivityFilters } from "@/lib/activity-filters";
import {
  KpiCard,
  DualKpi,
  isOverdue,
  statusBuckets,
  vencimentoBuckets,
  rankComOutros,
  BASE_SCALE,
  PRIORIDADE_COLORS,
} from "@/components/dashboard/dashboard-shared";

// Campos 4-6 (Propostas, Empresas, Visão Geral). Desde o PROMPT 3 (item 1.1)
// os três são widgets registrados como qualquer outro — entram pelo motor da
// S8 e ganham ordem, visibilidade e tamanho configuráveis, sem que nenhum
// indicador tenha sido removido. Por isso cada um exporta só o CONTEÚDO: o
// título fica por conta do motor, que já renderiza o mesmo `section > h3`.

function VerticalBars({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number; color: string }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="panel-card flex min-h-56 flex-col gap-4 p-4">
      <span className="ledger-label">{title}</span>
      <div className="flex flex-1 flex-col justify-end gap-2">
        {/* área do gráfico: altura fixa como referência de escala, com
            linhas-guia discretas em vez de uma caixa cinza por barra */}
        <div className="relative flex h-32 items-end gap-2.5">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="h-px bg-foreground/[0.06]" />
            <div className="h-px bg-foreground/[0.06]" />
            <div className="h-px bg-foreground/[0.06]" />
            <div className="h-px bg-foreground/15" />
          </div>
          {data.map((item) => (
            <div
              key={item.label}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground/85">
                {item.count}
              </span>
              <div
                className="w-full max-w-9 rounded-t-md shadow-[0_2px_6px_-2px_rgba(0,0,0,0.35)] transition-[height] duration-500 ease-out"
                style={{
                  height: `${Math.max(4, (item.count / max) * 100)}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.label}: ${item.count}`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5">
          {data.map((item) => (
            <span
              key={item.label}
              className="line-clamp-2 min-w-0 flex-1 text-center text-[11px] text-muted-foreground"
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PropostasWidget({
  filters,
  atividades,
}: {
  filters: ActivityFilters;
  atividades: Atividade[];
}) {
  const { lookups } = useAppData();

  const propostaTipo = lookups.tipoAtividade.find((t) => t.name.toLowerCase() === "proposta");
  const propostaExtra = propostaTipo ? { tipoAtividadeIds: [propostaTipo.id] } : {};

  const filtered = atividades.filter((a) => matchesActivity(a, filters, lookups));

  const propostas = propostaTipo
    ? filtered.filter((a) => a.tipoAtividadeIds.includes(propostaTipo.id))
    : [];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <KpiCard label="Total Propostas" value={propostas.length} color="var(--base-2)" href={atividadesHref(filters, propostaExtra)} />
          <KpiCard label="Propostas Urgentes" value={propostas.filter((a) => a.prioridade === "Urgente").length} color="var(--base-2)" href={atividadesHref(filters, { ...propostaExtra, prioridades: ["Urgente"] })} />
          <KpiCard label="Propostas Importantes" value={propostas.filter((a) => a.prioridade === "Importante").length} color="var(--base-2)" href={atividadesHref(filters, { ...propostaExtra, prioridades: ["Importante"] })} />
          <KpiCard label="Propostas Pendentes" value={propostas.filter((a) => a.status === "Pendente").length} color="var(--base-2)" href={atividadesHref(filters, { ...propostaExtra, status: ["Pendente"] })} />
          <KpiCard label="Propostas Vencidas" value={propostas.filter(isOverdue).length} color="var(--base-2)" href={atividadesHref(filters, { ...propostaExtra, prazos: ["atrasadas"] })} />
          <KpiCard
            label="Propostas Ganhas"
            value={propostas.filter((a) => a.propostas.some((p) => p.statusNegociacao === "aceite")).length}
            color="var(--negociacao-aceite)"
            href={atividadesHref(filters, { ...propostaExtra, statusNegociacao: ["aceite"] })}
          />
        </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VerticalBars title="Propostas x Status" data={statusBuckets(propostas)} />
        <VerticalBars title="Propostas x Vencimento" data={vencimentoBuckets(propostas)} />
      </div>
    </>
  );
}

export function EmpresasWidget({
  filters,
  atividades,
}: {
  filters: ActivityFilters;
  atividades: Atividade[];
}) {
  const { lookups } = useAppData();

  const propostaTipo = lookups.tipoAtividade.find((t) => t.name.toLowerCase() === "proposta");
  const propostaExtra = propostaTipo ? { tipoAtividadeIds: [propostaTipo.id] } : {};
  const filtered = atividades.filter((a) => matchesActivity(a, filters, lookups));
  const propostas = propostaTipo
    ? filtered.filter((a) => a.tipoAtividadeIds.includes(propostaTipo.id))
    : [];

  // Lacuna 5 — empresas ordenadas por volume (mais escuro = mais atividades);
  // da 6ª em diante, agrupadas em "Outros" (D9).
  const empresaData = rankComOutros(
    lookups.empresa
      .filter((e) => e.active)
      .map((e) => ({ label: e.name, count: filtered.filter((a) => a.empresaId === e.id).length }))
  );

  const mrrCount = propostas.filter((a) => a.propostas.some((p) => p.tipo === "MRR")).length;
  const psCount = propostas.filter((a) => a.propostas.some((p) => p.tipo === "PS")).length;

  const produtoData = lookups.servicoProduto
    .filter((s) => s.active)
    .map((s) => ({
      label: s.name,
      count: propostas.filter((a) => a.propostas.some((p) => p.servicoProdutoIds.includes(s.id))).length,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((d, i) => ({ ...d, color: BASE_SCALE[Math.min(i, BASE_SCALE.length - 1)] }));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VerticalBars
              title="Atividade x Empresa"
              data={empresaData.length ? empresaData : [{ label: "Sem dados", count: 0, color: "var(--base-4)" }]}
            />
          </div>
          <DualKpi
            label="Tipo de Produto/Serviço"
            color="var(--base-3)"
            left={{ label: "MRR", value: mrrCount, href: atividadesHref(filters, { ...propostaExtra, produtoTipos: ["MRR"] }) }}
            right={{ label: "PS", value: psCount, href: atividadesHref(filters, { ...propostaExtra, produtoTipos: ["PS"] }) }}
          />
        </div>
      <VerticalBars
        title="Produtos/Serviços vinculados"
        data={produtoData.length ? produtoData : [{ label: "Sem dados", count: 0, color: "var(--base-4)" }]}
      />
    </>
  );
}

// Campo 6 — Visão geral do filtro aplicado. A spec pede largura total; isso
// hoje é o tamanho "largo" do widget, que é o default de quem nunca mexeu.
export function VisaoGeralWidget({
  filters,
  atividades,
}: {
  filters: ActivityFilters;
  atividades: Atividade[];
}) {
  const { lookups } = useAppData();
  const filtered = atividades.filter((a) => matchesActivity(a, filters, lookups));
  const prioridadeData = (["Urgente", "Importante", "Médio", "Baixo"] as const).map((p) => ({
    label: p,
    count: filtered.filter((a) => a.prioridade === p).length,
    color: PRIORIDADE_COLORS[p],
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <VerticalBars title="Distribuição por status" data={statusBuckets(filtered)} />
      <VerticalBars title="Distribuição por prioridade" data={prioridadeData} />
    </div>
  );
}
