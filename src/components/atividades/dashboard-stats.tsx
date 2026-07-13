"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS, STATUS_NEGOCIACAO_OPTIONS, STATUS_NEGOCIACAO_LABELS } from "@/lib/types";
import type { Atividade } from "@/lib/types";
import {
  ClipboardList,
  CheckCircle2,
  AlarmClockOff,
  Wallet,
  Hourglass,
  Flame,
  AlertTriangle,
  FileSignature,
} from "lucide-react";
import { VerticalBarChart } from "@/components/charts/vertical-bar-chart";
import {
  STATUS_HEX,
  PRIORIDADE_HEX,
  STATUS_NEGOCIACAO_HEX,
  atividadePrazoStatus,
} from "@/lib/status-colors";
import { formatCurrency } from "@/lib/calculations";
import { DEFAULT_FILTERS, type ActivityFilters } from "@/components/atividades/filter-bar";

const BASE_ROTATION = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
  onClick,
  accentHex,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "dark" | "light";
  hint?: string;
  onClick?: () => void;
  accentHex?: string;
}) {
  return (
    <Card
      onClick={onClick}
      className={
        (tone === "dark"
          ? "border-none bg-[var(--base-1)] text-white shadow-lg shadow-[var(--base-1)]/25"
          : "border-none border-l-4 ring-1 ring-foreground/10") +
        (onClick ? " cursor-pointer transition-transform hover:-translate-y-0.5" : "")
      }
      style={tone === "light" ? { borderLeftColor: accentHex ?? "var(--base-4)" } : undefined}
    >
      <CardContent className="flex flex-col gap-1.5">
        <div
          className={`flex items-center gap-2 ${tone === "dark" ? "text-white/70" : accentHex ? "" : "text-muted-foreground"}`}
          style={tone === "light" && accentHex ? { color: accentHex } : undefined}
        >
          <Icon className="size-3.5" />
          <span className={`ledger-label ${tone === "dark" ? "text-white/70" : ""}`}>
            {label}
          </span>
        </div>
        <p className="kpi-value truncate text-[clamp(1rem,2vw,1.5rem)]" title={value}>
          {value}
        </p>
        {hint && (
          <span
            className={`w-fit rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase ${
              tone === "dark" ? "bg-white/15" : "bg-muted text-muted-foreground"
            }`}
          >
            {hint}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  atividades: Atividade[];
  onFilter?: (patch: Partial<ActivityFilters>) => void;
}

export function DashboardStats({ atividades, onFilter }: DashboardStatsProps) {
  const { lookups } = useAppData();

  const tipoProposta = lookups.tipoAtividade.find(
    (t) => t.name.toLowerCase() === "proposta"
  );

  const total = atividades.length;
  const concluidas = atividades.filter((a) => a.status === "Concluído").length;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const pendentes = atividades.filter((a) => a.status === "Pendente").length;
  const urgentes = atividades.filter((a) => a.prioridade === "Urgente").length;
  const importantes = atividades.filter((a) => a.prioridade === "Importante").length;
  const propostasAtividades = tipoProposta
    ? atividades.filter((a) => a.tipoAtividadeIds.includes(tipoProposta.id))
    : [];
  const propostasPendentes = propostasAtividades.filter((a) => a.status === "Pendente").length;

  const prazoStatusCounts = atividades.reduce(
    (acc, a) => {
      const s = atividadePrazoStatus(a);
      if (s) acc[s]++;
      return acc;
    },
    { "em-dia": 0, proximo: 0, vencido: 0 } as Record<string, number>
  );

  const valorTotal = atividades.reduce(
    (sum, a) => sum + a.propostas.reduce((s, p) => s + (p.valorTotal ?? 0), 0),
    0
  );

  const porStatus = STATUS_OPTIONS.map((s) => ({
    label: s,
    value: atividades.filter((a) => a.status === s).length,
    color: STATUS_HEX[s],
  }));

  const porPrioridade = PRIORIDADE_OPTIONS.map((p) => ({
    label: p,
    value: atividades.filter((a) => a.prioridade === p).length,
    color: PRIORIDADE_HEX[p],
  }));

  const statusNegociacaoCounts = STATUS_NEGOCIACAO_OPTIONS.map((s) => ({
    label: STATUS_NEGOCIACAO_LABELS[s],
    value: atividades.reduce(
      (sum, a) => sum + a.propostas.filter((p) => p.statusNegociacao === s).length,
      0
    ),
    color: STATUS_NEGOCIACAO_HEX[s],
  }));
  const temPropostaComStatus = statusNegociacaoCounts.some((s) => s.value > 0);

  const porEmpresaItems = lookups.empresa
    .filter((e) => e.active)
    .map((e, i) => ({
      id: e.id,
      label: e.name,
      value: atividades.filter((a) => a.empresaId === e.id).length,
      color: BASE_ROTATION[i % BASE_ROTATION.length],
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardList}
          label="Total de atividades"
          value={String(total).padStart(2, "0")}
          tone="dark"
          hint="controle vivo"
          onClick={() => onFilter?.(DEFAULT_FILTERS)}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Taxa de conclusão"
          value={`${taxaConclusao}%`}
          tone="light"
          hint={`${concluidas} concluídas`}
          accentHex="var(--base-3)"
          onClick={() => onFilter?.({ status: "Concluído" })}
        />
        <KpiCard
          icon={AlarmClockOff}
          label="Vencidas"
          value={String(prazoStatusCounts.vencido)}
          tone="light"
          hint={`${prazoStatusCounts.proximo} perto do prazo`}
          accentHex="var(--prazo-vencido)"
          onClick={() => onFilter?.({ prazo: "atrasadas" })}
        />
        <KpiCard
          icon={Wallet}
          label="Valor em propostas"
          value={valorTotal > 0 ? formatCurrency(valorTotal) : "—"}
          tone="light"
          hint="propostas ativas"
          accentHex="var(--negociacao-aceite)"
          onClick={tipoProposta ? () => onFilter?.({ tipoAtividadeId: tipoProposta.id }) : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          icon={Hourglass}
          label="Pendentes"
          value={String(pendentes)}
          tone="light"
          accentHex="var(--status-pendente)"
          onClick={() => onFilter?.({ status: "Pendente" })}
        />
        <KpiCard
          icon={Flame}
          label="Prioridade urgente"
          value={String(urgentes)}
          tone="light"
          accentHex="var(--prioridade-urgente)"
          onClick={() => onFilter?.({ prioridade: "Urgente" })}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Prioridade importante"
          value={String(importantes)}
          tone="light"
          accentHex="var(--prioridade-importante)"
          onClick={() => onFilter?.({ prioridade: "Importante" })}
        />
        <KpiCard
          icon={FileSignature}
          label="Total de propostas"
          value={String(propostasAtividades.length)}
          tone="light"
          accentHex="var(--base-2)"
          onClick={tipoProposta ? () => onFilter?.({ tipoAtividadeId: tipoProposta.id }) : undefined}
        />
        <KpiCard
          icon={FileSignature}
          label="Propostas pendentes"
          value={String(propostasPendentes)}
          tone="light"
          accentHex="var(--status-pendente)"
          onClick={
            tipoProposta
              ? () => onFilter?.({ tipoAtividadeId: tipoProposta.id, status: "Pendente" })
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Distribuição por status</span>
            <VerticalBarChart
              segments={porStatus}
              onSegmentClick={(i) => onFilter?.({ status: porStatus[i].label })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Distribuição por prioridade</span>
            <VerticalBarChart
              segments={porPrioridade}
              onSegmentClick={(i) => onFilter?.({ prioridade: porPrioridade[i].label })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Atividades por empresa</span>
            {porEmpresaItems.length === 0 ? (
              <span className="text-sm text-muted-foreground">Sem dados ainda</span>
            ) : (
              <VerticalBarChart
                segments={porEmpresaItems}
                onSegmentClick={(i) => onFilter?.({ empresaId: porEmpresaItems[i].id })}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {temPropostaComStatus && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Status de negociação das propostas</span>
            <VerticalBarChart segments={statusNegociacaoCounts} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
