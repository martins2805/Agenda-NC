"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Trash2, CheckSquare } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { diasEmPendencia } from "@/lib/calculations";
import type { Atividade } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORIDADE_STYLES: Record<Atividade["prioridade"], string> = {
  Urgente: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  Importante: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Médio: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Baixo: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-300",
};

const STATUS_STYLES: Record<Atividade["status"], string> = {
  Concluído: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Pendente: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  "Aguardando retorno interno": "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  "Aguardando retorno cliente": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS_STYLES[atividade.status])}>
            {atividade.status}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 font-medium", PRIORIDADE_STYLES[atividade.prioridade])}>
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
        </div>
      </CardContent>
    </Card>
  );
}
