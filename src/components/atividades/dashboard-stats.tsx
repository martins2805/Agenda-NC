"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Atividade } from "@/lib/types";
import { ClipboardList } from "lucide-react";

export function DashboardStats({ atividades }: { atividades: Atividade[] }) {
  const { lookups } = useAppData();

  const total = atividades.length;

  const porTipo = lookups.tipoAtividade
    .filter((t) => t.active)
    .map((t) => ({
      name: t.name,
      count: atividades.filter((a) => a.tipoAtividadeIds.includes(t.id)).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="lg:col-span-1">
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="size-4" />
            <span className="text-sm font-medium">Total de atividades</span>
          </div>
          <p className="text-4xl font-bold tracking-tight">{total}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Por status</span>
          <div className="flex flex-col gap-1 text-sm">
            {STATUS_OPTIONS.map((s) => (
              <div key={s} className="flex items-center justify-between">
                <span className="truncate">{s}</span>
                <span className="font-semibold">
                  {atividades.filter((a) => a.status === s).length}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Por prioridade</span>
          <div className="flex flex-col gap-1 text-sm">
            {PRIORIDADE_OPTIONS.map((p) => (
              <div key={p} className="flex items-center justify-between">
                <span>{p}</span>
                <span className="font-semibold">
                  {atividades.filter((a) => a.prioridade === p).length}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Por tipo de atividade</span>
          <div className="flex flex-col gap-1 text-sm">
            {porTipo.length === 0 && (
              <span className="text-muted-foreground">Sem dados ainda</span>
            )}
            {porTipo.slice(0, 5).map((t) => (
              <div key={t.name} className="flex items-center justify-between">
                <span className="truncate">{t.name}</span>
                <span className="font-semibold">{t.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
