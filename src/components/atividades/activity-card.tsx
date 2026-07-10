"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Trash2, CheckSquare } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { diasEmPendencia, formatCurrency } from "@/lib/calculations";
import type { Atividade } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORIDADE_STYLES: Record<Atividade["prioridade"], string> = {
  Urgente: "bg-[var(--chart-3)] text-white",
  Importante: "bg-[var(--chart-1)] text-white",
  Médio: "bg-[var(--chart-2)] text-white",
  Baixo: "bg-muted text-muted-foreground",
};

const STATUS_STYLES: Record<Atividade["status"], string> = {
  Concluído: "bg-[var(--chart-2)] text-white",
  Pendente: "bg-[var(--chart-4)] text-[var(--chart-1)]",
  "Aguardando retorno interno": "bg-[var(--chart-1)] text-white",
  "Aguardando retorno cliente": "bg-[var(--chart-3)] text-white",
};

interface ActivityCardProps {
  atividade: Atividade;
  onEdit: () => void;
}

export function ActivityCard({ atividade, onEdit }: ActivityCardProps) {
  const { lookups, deleteAtividade } = useAppData();

  const empresa = lookups.empresa.find((e) => e.id === atividade.empresaId);
  const unidade = lookups.unidade.find((u) => u.id === atividade.unidadeId);
  const assunto = lookups.assunto.find((a) => a.id === atividade.assuntoId);
  const tipos = lookups.tipoAtividade.filter((t) =>
    atividade.tipoAtividadeIds.includes(t.id)
  );
  const dias = diasEmPendencia(atividade);
  const checkTotal = atividade.checklist.length;
  const checkDone = atividade.checklist.filter((c) => c.concluido).length;
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;
  const propostaTotal = atividade.propostas.reduce(
    (sum, p) => sum + (p.valorTotal ?? 0),
    0
  );

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onEdit}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-tight">
              {empresa?.name ?? "Sem empresa"}
              {unidade && <span className="text-muted-foreground"> · {unidade.name}</span>}
            </p>
            {assunto && (
              <p className="text-sm text-muted-foreground">{assunto.name}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteAtividade(atividade.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        {tipos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tipos.map((t) => (
              <Badge key={t.id} variant="outline">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className={cn("rounded-full px-2.5 py-0.5 font-medium tracking-wide uppercase", STATUS_STYLES[atividade.status])}>
            {atividade.status}
          </span>
          <span className={cn("rounded-full px-2.5 py-0.5 font-medium tracking-wide uppercase", PRIORIDADE_STYLES[atividade.prioridade])}>
            {atividade.prioridade}
          </span>
          {dias !== null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {dias}d em pendência
            </span>
          )}
          {checkTotal > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <CheckSquare className="size-3.5" />
              {checkDone}/{checkTotal}
            </span>
          )}
          {atividade.prazo && (
            <span className="text-muted-foreground">
              Prazo: {new Date(atividade.prazo).toLocaleDateString("pt-BR")}
            </span>
          )}
          {propostaTotal > 0 && (
            <span className="rounded-full bg-[var(--chart-5)] px-2.5 py-0.5 font-medium text-[var(--chart-1)]">
              {formatCurrency(propostaTotal)}
            </span>
          )}
        </div>

        {checkTotal > 0 && (
          <div className="stat-bar">
            <span style={{ width: `${checkPct}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
