"use client";

import Link from "next/link";
import type { Atividade } from "@/lib/types";
import { matchesPrazoRange } from "@/lib/activity-filters";
import type { BarListItem } from "@/components/charts/bar-list";

// Compartilhado entre os widgets do motor (Campos 1-3, S8) e o restante de
// DashboardAnalytics (Campos 4-6, ainda não migrados para widget — S9).

export const STATUS_BUCKET_COLORS = {
  Pendente: "var(--status-pendente)",
  "Aguardando retorno": "var(--status-outro)",
  Concluído: "var(--status-concluido)",
} as const;

export const VENCIMENTO_COLORS = {
  Atrasadas: "var(--prazo-vencido)",
  "Vencem hoje": "var(--prazo-proximo)",
  "Próximos 7 dias": "var(--base-3)",
  "Próximos 30 dias": "var(--prazo-em-dia)",
} as const;

export const PRIORIDADE_COLORS = {
  Urgente: "var(--prioridade-urgente)",
  Importante: "var(--prioridade-importante)",
  Médio: "var(--prioridade-medio)",
  Baixo: "var(--prioridade-baixo)",
} as const;

// Paleta base para gráficos categóricos (empresa/produto), do mais escuro ao
// mais claro — quem tem mais atividades aparece primeiro e mais escuro (D9).
export const BASE_SCALE = ["var(--base-1)", "var(--base-2)", "var(--base-3)", "var(--base-4)"];

// Adapta {label, count, color} (formato dos buckets abaixo, herdado do antigo
// VerticalBars) para {label, value, color} (BarList).
export function toBarListItems(data: { label: string; count: number; color: string }[]): BarListItem[] {
  return data.map((d) => ({ label: d.label, value: d.count, color: d.color }));
}

export function isOverdue(a: Atividade) {
  return a.status !== "Concluído" && matchesPrazoRange(a.prazo, "atrasadas");
}

export function statusBuckets(list: Atividade[]) {
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

export function vencimentoBuckets(list: Atividade[]) {
  const abertas = list.filter((a) => a.status !== "Concluído");
  return [
    { label: "Atrasadas", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "atrasadas")).length, color: VENCIMENTO_COLORS.Atrasadas },
    { label: "Vencem hoje", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "hoje")).length, color: VENCIMENTO_COLORS["Vencem hoje"] },
    { label: "Próximos 7 dias", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "7dias")).length, color: VENCIMENTO_COLORS["Próximos 7 dias"] },
    { label: "Próximos 30 dias", count: abertas.filter((a) => matchesPrazoRange(a.prazo, "30dias")).length, color: VENCIMENTO_COLORS["Próximos 30 dias"] },
  ];
}

export function KpiCard({
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

export function DualKpi({
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
