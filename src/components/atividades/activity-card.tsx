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
  Urgente: "border-[#b25a3e]/40 text-[#a04e35] bg-[#b25a3e]/[0.06]",
  Importante: "border-[#a24d63]/40 text-[#93435a] bg-[#a24d63]/[0.06]",
  Médio: "border-[#7c68a0]/40 text-[#6f5d90] bg-[#7c68a0]/[0.06]",
  Baixo: "border-border text-muted-foreground",
};

const STATUS_STYLES: Record<Atividade["status"], string> = {
  Concluído: "border-[#5e7350]/40 text-[#526645] bg-[#5e7350]/[0.06]",
  Pendente: "border-[#a56a3f]/40 text-[#935e37] bg-[#a56a3f]/[0.06]",
  "Aguardando retorno interno": "border-[#7c68a0]/40 text-[#6f5d90] bg-[#7c68a0]/[0.06]",
  "Aguardando retorno cliente": "border-[#9c7a3a]/40 text-[#8a6b32] bg-[#9c7a3a]/[0.06]",
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
          <span className={cn("rounded-full border px-2.5 py-0.5 font-medium tracking-wide uppercase", STATUS_STYLES[atividade.status])}>
            {atividade.status}
          </span>
          <span className={cn("rounded-full border px-2.5 py-0.5 font-medium tracking-wide uppercase", PRIORIDADE_STYLES[atividade.prioridade])}>
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
            <span className="rounded-full border border-primary/30 bg-primary/[0.06] px-2.5 py-0.5 font-medium text-primary">
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
