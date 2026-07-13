"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Atividade } from "@/lib/types";
import {
  ClipboardList,
  CheckCircle2,
  AlarmClockOff,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { TILE_COLORS } from "@/lib/tile-colors";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarList } from "@/components/charts/bar-list";
import { TrendLine } from "@/components/charts/trend-line";
import { STATUS_HEX, PRIORIDADE_HEX, atividadePrazoStatus } from "@/lib/status-colors";
import { formatCurrency, todayLocalDateString } from "@/lib/calculations";

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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "dark" | "light";
  hint?: string;
}) {
  return (
    <Card
      className={
        tone === "dark"
          ? "border-none bg-[var(--base-1)] text-white shadow-lg shadow-[var(--base-1)]/25"
          : "border-none ring-1 ring-foreground/10"
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
        <p className="kpi-value truncate text-[clamp(1.1rem,2.2vw,1.875rem)]" title={value}>
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

export function DashboardStats({ atividades }: { atividades: Atividade[] }) {
  const { lookups } = useAppData();

  const total = atividades.length;
  const concluidas = atividades.filter((a) => a.status === "Concluído").length;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

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

  const porTipo = lookups.tipoAtividade
    .filter((t) => t.active)
    .map((t) => ({
      name: t.name,
      count: atividades.filter((a) => a.tipoAtividadeIds.includes(t.id)).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const porEmpresa = lookups.empresa
    .filter((e) => e.active)
    .map((e, i) => ({
      label: e.name,
      value: atividades.filter((a) => a.empresaId === e.id).length,
      color: BASE_ROTATION[i % BASE_ROTATION.length],
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const today = todayLocalDateString();
  const trend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return atividades.filter((a) => a.createdAt.slice(0, 10) === key).length;
  });
  void today;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardList}
          label="Total de atividades"
          value={String(total).padStart(2, "0")}
          tone="dark"
          hint="controle vivo"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Taxa de conclusão"
          value={`${taxaConclusao}%`}
          tone="light"
          hint={`${concluidas} concluídas`}
        />
        <KpiCard
          icon={AlarmClockOff}
          label="Vencidas"
          value={String(prazoStatusCounts.vencido)}
          tone="light"
          hint={`${prazoStatusCounts.proximo} perto do prazo`}
        />
        <KpiCard
          icon={Wallet}
          label="Valor em propostas"
          value={valorTotal > 0 ? formatCurrency(valorTotal) : "—"}
          tone="light"
          hint="propostas ativas"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Distribuição por status</span>
            <DonutChart segments={porStatus} centerLabel="atividades" centerValue={total} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="ledger-label">Distribuição por prioridade</span>
            <DonutChart
              segments={porPrioridade}
              centerLabel="atividades"
              centerValue={total}
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
            {porEmpresa.length === 0 ? (
              <span className="text-sm text-muted-foreground">Sem dados ainda</span>
            ) : (
              <BarList items={porEmpresa} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="ledger-label">Por tipo de atividade</span>
          {porTipo.length === 0 ? (
            <span className="text-sm text-muted-foreground">Sem dados ainda</span>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {porTipo.slice(0, 12).map((t, i) => (
                <div
                  key={t.name}
                  className={`flex flex-col justify-between gap-3 rounded-lg p-2.5 ${TILE_COLORS[i % TILE_COLORS.length]}`}
                  title={`${t.name}: ${t.count}`}
                >
                  <span className="line-clamp-1 text-[10px] font-medium opacity-80">
                    {t.name}
                  </span>
                  <span className="font-mono text-lg font-bold">{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
