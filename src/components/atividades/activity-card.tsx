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
  Urgente: "border-[#c96a4e]/50 text-[#e08a6c]",
  Importante: "border-[#d9822f]/50 text-[#e6b374]",
  Médio: "border-[#5b8aa6]/50 text-[#8ab2c8]",
  Baixo: "border-border text-muted-foreground",
};

const STATUS_STYLES: Record<Atividade["status"], string> = {
  Concluído: "border-[#5f9e77]/50 text-[#7fbb96]",
  Pendente: "border-[#d9822f]/50 text-[#e6b374]",
  "Aguardando retorno interno": "border-[#8d7cae]/50 text-[#ad9fcb]",
  "Aguardando retorno cliente": "border-[#5b8aa6]/50 text-[#8ab2c8]",
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

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className={cn("border px-2 py-0.5 font-medium uppercase tracking-wide", STATUS_STYLES[atividade.status])}>
            {atividade.status}
          </span>
          <span className={cn("border px-2 py-0.5 font-medium uppercase tracking-wide", PRIORIDADE_STYLES[atividade.prioridade])}>
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
