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
  TrendingUp,
  Hourglass,
  Flame,
  AlertTriangle,
  FileSignature,
} from "lucide-react";
import { TILE_COLORS } from "@/lib/tile-colors";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarList } from "@/components/charts/bar-list";
import { TrendLine } from "@/components/charts/trend-line";
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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "dark" | "light";
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={
        (tone === "dark"
          ? "border-none bg-[var(--base-1)] text-white shadow-lg shadow-[var(--base-1)]/25"
          : "border-none ring-1 ring-foreground/10") + (onClick ? " cursor-pointer transition-transform hover:-translate-y-0.5" : "")
      }
    >
      <CardContent className="flex flex-col gap-1.5">
        <div
          className={`flex items-center gap-2 ${tone === "dark" ? "text-white/70" : "text-muted-foreground"}`}
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

  const porTipo = lookups.tipoAtividade
    .filter((t) => t.active)
    .map((t) => ({
      id: t.id,
      name: t.name,
      count: atividades.filter((a) => a.tipoAtividadeIds.includes(t.id)).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

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

  function localDateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = localDateKey(d);
    return atividades.filter((a) => localDateKey(new Date(a.createdAt)) === key).length;
  });

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
          onClick={() => onFilter?.({ status: "Concluído" })}
        />
        <KpiCard
          icon={AlarmClockOff}
          label="Vencidas"
          value={String(prazoStatusCounts.vencido)}
          tone="light"
          hint={`${prazoStatusCounts.proximo} perto do prazo`}
          onClick={() => onFilter?.({ prazo: "atrasadas" })}
        />
        <KpiCard
          icon={Wallet}
          label="Valor em propostas"
          value={valorTotal > 0 ? formatCurrency(valorTotal) : "—"}
          tone="light"
          hint="propostas ativas"
          onClick={tipoProposta ? () => onFilter?.({ tipoAtividadeId: tipoProposta.id }) : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          icon={Hourglass}
          label="Pendentes"
          value={String(pendentes)}
          tone="light"
          onClick={() => onFilter?.({ status: "Pendente" })}
        />
        <KpiCard
          icon={Flame}
          label="Prioridade urgente"
          value={String(urgentes)}
          tone="light"
          onClick={() => onFilter?.({ prioridade: "Urgente" })}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Prioridade importante"
          value={String(importantes)}
          tone="light"
          onClick={() => onFilter?.({ prioridade: "Importante" })}
        />
        <KpiCard
          icon={FileSignature}
          label="Total de propostas"
          value={String(propostasAtividades.length)}
          tone="light"
          onClick={tipoProposta ? () => onFilter?.({ tipoAtividadeId: tipoProposta.id }) : undefined}
        />
        <KpiCard
          icon={FileSignature}
          label="Propostas pendentes"
          value={String(propostasPendentes)}
          tone="light"
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
            <DonutChart
              segments={porStatus}
              centerLabel="atividades"
              centerValue={total}
              onSegmentClick={(i) => onFilter?.({ status: porStatus[i].label })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Distribuição por prioridade</span>
            <DonutChart
              segments={porPrioridade}
              centerLabel="atividades"
              centerValue={total}
              onSegmentClick={(i) => onFilter?.({ prioridade: porPrioridade[i].label })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="ledger-label">Evolução (14 dias)</span>
              <TrendingUp className="size-3.5 text-muted-foreground" />
            </div>
            <TrendLine points={trend} color="var(--base-1)" />
            <div className="divider-dashed" />
            <span className="ledger-label">Atividades por empresa</span>
            {porEmpresaItems.length === 0 ? (
              <span className="text-sm text-muted-foreground">Sem dados ainda</span>
            ) : (
              <BarList
                items={porEmpresaItems}
                onItemClick={(i) => onFilter?.({ empresaId: porEmpresaItems[i].id })}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {temPropostaComStatus && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Status de negociação das propostas</span>
            <DonutChart
              segments={statusNegociacaoCounts}
              centerLabel="propostas"
              centerValue={statusNegociacaoCounts.reduce((s, c) => s + c.value, 0)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="ledger-label">Por tipo de atividade</span>
          {porTipo.length === 0 ? (
            <span className="text-sm text-muted-foreground">Sem dados ainda</span>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {porTipo.slice(0, 12).map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onFilter?.({ tipoAtividadeId: t.id })}
                  className={`flex flex-col justify-between gap-3 rounded-lg p-2.5 text-left transition-transform hover:-translate-y-0.5 ${TILE_COLORS[i % TILE_COLORS.length]}`}
                  title={`${t.name}: ${t.count}`}
                >
                  <span className="line-clamp-1 text-[10px] font-medium opacity-80">
                    {t.name}
                  </span>
                  <span className="font-mono text-lg font-bold">{t.count}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
