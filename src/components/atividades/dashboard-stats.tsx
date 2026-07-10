"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Atividade } from "@/lib/types";
import { ClipboardList } from "lucide-react";
import { TILE_COLORS } from "@/lib/tile-colors";

function StatBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="stat-bar">
      <span style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

export function DashboardStats({ atividades }: { atividades: Atividade[] }) {
  const { lookups } = useAppData();

  const total = atividades.length;

  const porStatus = STATUS_OPTIONS.map((s) => ({
    label: s,
    count: atividades.filter((a) => a.status === s).length,
  }));
  const porPrioridade = PRIORIDADE_OPTIONS.map((p) => ({
    label: p,
    count: atividades.filter((a) => a.prioridade === p).length,
  }));

  const porTipo = lookups.tipoAtividade
    .filter((t) => t.active)
    .map((t) => ({
      name: t.name,
      count: atividades.filter((a) => a.tipoAtividadeIds.includes(t.id)).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxStatus = Math.max(1, ...porStatus.map((s) => s.count));
  const maxPrioridade = Math.max(1, ...porPrioridade.map((p) => p.count));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="lg:col-span-1 border-none bg-[var(--chart-1)] text-white shadow-lg shadow-[var(--chart-1)]/20">
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/70">
            <ClipboardList className="size-3.5" />
            <span className="ledger-label text-white/70">Total de atividades</span>
          </div>
          <p className="font-mono text-4xl font-bold tracking-tight">
            {String(total).padStart(2, "0")}
          </p>
          <span className="w-fit rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
            controle vivo
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="ledger-label">Por status</span>
          <div className="flex flex-col gap-2 text-sm">
            {porStatus.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate">{s.label}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
                <StatBar value={s.count} max={maxStatus} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="ledger-label">Por prioridade</span>
          <div className="flex flex-col gap-2 text-sm">
            {porPrioridade.map((p) => (
              <div key={p.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span>{p.label}</span>
                  <span className="font-semibold">{p.count}</span>
                </div>
                <StatBar value={p.count} max={maxPrioridade} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="ledger-label">Por tipo de atividade</span>
          {porTipo.length === 0 ? (
            <span className="text-sm text-muted-foreground">Sem dados ainda</span>
          ) : (
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {porTipo.slice(0, 6).map((t, i) => (
                <div
                  key={t.name}
                  className={`flex flex-col justify-between gap-2 rounded-lg p-2 ${TILE_COLORS[i % TILE_COLORS.length]}`}
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
