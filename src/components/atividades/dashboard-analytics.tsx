"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade, AtividadeGeral, Planilha, Registro } from "@/lib/types";
import {
  atividadesHref,
  execucoesHref,
  matchesActivity,
  matchesPrazoRange,
  simpleHref,
  type ActivityFilters,
} from "@/lib/activity-filters";

// Cores dos gráficos por dimensão (conforme especificação da Parte 7).
const STATUS_BUCKET_COLORS = {
  Pendente: "#780001",
  "Aguardando retorno": "#3E4C59",
  Concluído: "#2E5749",
} as const;

const VENCIMENTO_COLORS = {
  Atrasadas: "#780001",
  "Vencem hoje": "#BF512C",
  "Próximos 7 dias": "#8BAAAD",
  "Próximos 30 dias": "#2E5749",
} as const;

const PRIORIDADE_COLORS = {
  Urgente: "#780001",
  Importante: "#BF512C",
  Médio: "#DA9B2B",
  Baixo: "#2E5749",
} as const;

// Paleta base para gráficos categóricos (empresa/produto), do mais escuro ao
// mais claro — quem tem mais atividades aparece primeiro e mais escuro.
const BASE_SCALE = ["#1F2C43", "#3E4C59", "#8BAAAD", "#D8D8D8"];

function isOverdue(a: Atividade) {
  return a.status !== "Concluído" && matchesPrazoRange(a.prazo, "atrasadas");
}

function KpiCard({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: string | number;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between gap-2 rounded-2xl p-4 text-white shadow-[0_16px_36px_-24px_rgba(31,44,67,0.5)] transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: color }}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-white/80">{label}</span>
      <span className="font-mono text-xl font-bold">{value}</span>
    </Link>
  );
}

function DualKpi({
  label,
  left,
  right,
  color,
}: {
  label: string;
  left: { label: string; value: number; href: string };
  right: { label: string; value: number; href: string };
  color: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4 text-white shadow-[0_16px_36px_-24px_rgba(31,44,67,0.5)]"
      style={{ backgroundColor: color }}
    >
      <span className="text-xs font-bold uppercase tracking-wide text-white/80">{label}</span>
      <div className="flex items-end justify-between gap-3">
        {[left, right].map((side) => (
          <Link key={side.label} href={side.href} className="flex flex-col hover:opacity-90">
            <span className="font-mono text-xl font-bold">{side.value}</span>
            <span className="text-xs font-medium text-white/80">{side.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

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

function Lacuna({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function statusBuckets(list: Atividade[]) {
  return [
    { label: "Pendente", count: list.filter((a) => a.status === "Pendente").length, color: STATUS_BUCKET_COLORS.Pendente },
    {
      label: "Aguardando retorno",
      count: list.filter(
        (a) => a.status === "Aguardando retorno interno" || a.status === "Aguardando retorno cliente"
      ).length,
      color: STATUS_BUCKET_COLORS["Aguardando retorno"],
    },
    { label: "Concluído", count: list.filter((a) => a.status === "Concluído").length, color: STATUS_BUCKET_COLORS.Concluído },
  ];
}

function vencimentoBuckets(list: Atividade[]) {
  const abertas = list.filter((a) => a.status !== "Concluído");
  return [
    { label: "Atrasadas", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "atrasadas")).length, color: VENCIMENTO_COLORS.Atrasadas },
    { label: "Vencem hoje", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "hoje")).length, color: VENCIMENTO_COLORS["Vencem hoje"] },
    { label: "Próximos 7 dias", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "7dias")).length, color: VENCIMENTO_COLORS["Próximos 7 dias"] },
    { label: "Próximos 30 dias", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "30dias")).length, color: VENCIMENTO_COLORS["Próximos 30 dias"] },
  ];
}

export function DashboardAnalytics({
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

  const propostaTipo = lookups.tipoAtividade.find((t) => t.name.toLowerCase() === "proposta");
  const propostaExtra = propostaTipo ? { tipoAtividadeIds: [propostaTipo.id] } : {};

  const filtered = useMemo(
    () => atividades.filter((a) => matchesActivity(a, filters, lookups)),
    [atividades, filters, lookups]
  );

  // Execuções filtradas (apenas dimensões compatíveis com o modelo geral).
  const execucoesFiltered = useMemo(() => {
    return atividadesGerais.filter((a) => {
      if (filters.empresaIds.length > 0 && !(a.empresaId && filters.empresaIds.includes(a.empresaId))) return false;
      if (filters.unidadeIds.length > 0 && !(a.unidadeId && filters.unidadeIds.includes(a.unidadeId))) return false;
      if (filters.prioridades.length > 0 && !filters.prioridades.includes(a.prioridade)) return false;
      if (!filters.prazos.length ? false : !filters.prazos.some((r) => matchesPrazoRange(a.prazo, r))) return false;
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

  const propostas = propostaTipo
    ? filtered.filter((a) => a.tipoAtividadeIds.includes(propostaTipo.id))
    : [];

  const total = filtered.length;
  const concluidas = filtered.filter((a) => a.status === "Concluído").length;
  const indiceConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  // Lacuna 5 — empresas ordenadas por volume (mais escuro = mais atividades).
  const empresaData = lookups.empresa
    .filter((e) => e.active)
    .map((e) => ({ label: e.name, count: filtered.filter((a) => a.empresaId === e.id).length }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((d, i) => ({ ...d, color: BASE_SCALE[Math.min(i, BASE_SCALE.length - 1)] }));

  // MRR x PS (propostas)
  const mrrCount = propostas.filter((a) => a.propostas.some((p) => p.tipo === "MRR")).length;
  const psCount = propostas.filter((a) => a.propostas.some((p) => p.tipo === "PS")).length;

  // Produtos/serviços vinculados a propostas.
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

  const prioridadeData = (["Urgente", "Importante", "Médio", "Baixo"] as const).map((p) => ({
    label: p,
    count: filtered.filter((a) => a.prioridade === p).length,
    color: PRIORIDADE_COLORS[p],
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Lacuna 1 — Dados gerais */}
      <Lacuna title="Dados gerais">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard label="Total de atividades" value={total} color="#1F2C43" href={atividadesHref(filters)} />
          <KpiCard label="Total de execuções" value={execucoesFiltered.length} color="#3E4C59" href={execucoesHref(filters)} />
          <KpiCard label="Total de registros" value={registrosFiltered.length} color="#8BAAAD" href={simpleHref("/registros", filters)} />
          <KpiCard label="Total de planilhas" value={planilhasFiltered.length} color="#8BAAAD" href={simpleHref("/planilhas", filters)} />
        </div>
      </Lacuna>

      {/* Lacuna 2 — Status atividades */}
      <Lacuna title="Status atividades">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard label="Índice de Conclusão Atividades" value={`${indiceConclusao}%`} color="#3E4C59" href={atividadesHref(filters)} />
          <KpiCard label="Atividades Pendentes" value={filtered.filter((a) => a.status === "Pendente").length} color="#780001" href={atividadesHref(filters, { status: ["Pendente"] })} />
          <KpiCard label="Atividades Vencidas" value={filtered.filter(isOverdue).length} color="#BF512C" href={atividadesHref(filters, { prazos: ["atrasadas"] })} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VerticalBars title="Status de Conclusão" data={statusBuckets(filtered)} />
          <VerticalBars title="Status de vencimento" data={vencimentoBuckets(filtered)} />
        </div>
      </Lacuna>

      {/* Lacuna 3 — Prioridade */}
      <Lacuna title="Prioridade">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-3">
            <KpiCard label="Atividades urgentes" value={filtered.filter((a) => a.prioridade === "Urgente").length} color="#780001" href={atividadesHref(filters, { prioridades: ["Urgente"] })} />
            <KpiCard label="Atividades Importantes" value={filtered.filter((a) => a.prioridade === "Importante").length} color="#BF512C" href={atividadesHref(filters, { prioridades: ["Importante"] })} />
          </div>
          <div className="lg:col-span-2">
            <VerticalBars title="Atividades x Prioridade" data={prioridadeData} />
          </div>
        </div>
      </Lacuna>

      {/* Lacuna 4 — Propostas */}
      <Lacuna title="Propostas">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard label="Total atividades de proposta" value={propostas.length} color="#3E4C59" href={atividadesHref(filters, propostaExtra)} />
          <KpiCard label="Propostas Urgentes" value={propostas.filter((a) => a.prioridade === "Urgente").length} color="#3E4C59" href={atividadesHref(filters, { ...propostaExtra, prioridades: ["Urgente"] })} />
          <KpiCard label="Propostas Importantes" value={propostas.filter((a) => a.prioridade === "Importante").length} color="#3E4C59" href={atividadesHref(filters, { ...propostaExtra, prioridades: ["Importante"] })} />
          <KpiCard label="Propostas Pendentes" value={propostas.filter((a) => a.status === "Pendente").length} color="#3E4C59" href={atividadesHref(filters, { ...propostaExtra, status: ["Pendente"] })} />
          <KpiCard label="Propostas Vencidas" value={propostas.filter(isOverdue).length} color="#3E4C59" href={atividadesHref(filters, { ...propostaExtra, prazos: ["atrasadas"] })} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VerticalBars title="Propostas x Status" data={statusBuckets(propostas)} />
          <VerticalBars title="Propostas x Vencimento" data={vencimentoBuckets(propostas)} />
        </div>
      </Lacuna>

      {/* Lacuna 5 — Empresas */}
      <Lacuna title="Empresas">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VerticalBars
              title="Atividade x Empresa"
              data={empresaData.length ? empresaData : [{ label: "Sem dados", count: 0, color: "#D8D8D8" }]}
            />
          </div>
          <DualKpi
            label="Tipo de Produto/Serviço"
            color="#8BAAAD"
            left={{ label: "MRR", value: mrrCount, href: atividadesHref(filters, { ...propostaExtra, produtoTipos: ["MRR"] }) }}
            right={{ label: "PS", value: psCount, href: atividadesHref(filters, { ...propostaExtra, produtoTipos: ["PS"] }) }}
          />
        </div>
        <VerticalBars
          title="Produtos/Serviços vinculados"
          data={produtoData.length ? produtoData : [{ label: "Sem dados", count: 0, color: "#D8D8D8" }]}
        />
      </Lacuna>

      {/* Lacuna 6 — Visão geral do filtro aplicado */}
      <Lacuna title="Visão geral">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VerticalBars title="Distribuição por status" data={statusBuckets(filtered)} />
          <VerticalBars title="Distribuição por prioridade" data={prioridadeData} />
        </div>
      </Lacuna>
    </div>
  );
}
