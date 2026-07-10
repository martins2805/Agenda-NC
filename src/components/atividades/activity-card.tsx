"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarClock, Trash2, CheckSquare, Phone, Check } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { diasEmPendencia, formatCurrency } from "@/lib/calculations";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
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

function QuickStatusBadge({ atividade }: { atividade: Atividade }) {
  const { updateAtividade } = useAppData();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        render={
          <button
            type="button"
            className={cn(
              "rounded-full px-2.5 py-0.5 font-medium tracking-wide uppercase transition-opacity hover:opacity-80",
              STATUS_STYLES[atividade.status]
            )}
          />
        }
      >
        {atividade.status}
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-1"
        align="start"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm normal-case hover:bg-muted"
            onClick={() => {
              updateAtividade(atividade.id, { status: s });
              setOpen(false);
            }}
          >
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", STATUS_STYLES[s])} />
              {s}
            </span>
            {s === atividade.status && <Check className="size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function QuickPrioridadeBadge({ atividade }: { atividade: Atividade }) {
  const { updateAtividade } = useAppData();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        render={
          <button
            type="button"
            className={cn(
              "rounded-full px-2.5 py-0.5 font-medium tracking-wide uppercase transition-opacity hover:opacity-80",
              PRIORIDADE_STYLES[atividade.prioridade]
            )}
          />
        }
      >
        {atividade.prioridade}
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-1"
        align="start"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {PRIORIDADE_OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm normal-case hover:bg-muted"
            onClick={() => {
              updateAtividade(atividade.id, { prioridade: p });
              setOpen(false);
            }}
          >
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", PRIORIDADE_STYLES[p])} />
              {p}
            </span>
            {p === atividade.prioridade && <Check className="size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function QuickPrazo({ atividade }: { atividade: Atividade }) {
  const { updateAtividade } = useAppData();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Input
        type="date"
        autoFocus
        defaultValue={atividade.prazo ?? ""}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          updateAtividade(atividade.id, { prazo: e.target.value || null });
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-6 w-32 px-1.5 text-[11px]"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="text-muted-foreground hover:underline"
    >
      {atividade.prazo
        ? `Prazo: ${new Date(atividade.prazo).toLocaleDateString("pt-BR")}`
        : "+ prazo"}
    </button>
  );
}

function QuickContato({ atividade }: { atividade: Atividade }) {
  const { updateAtividade } = useAppData();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Input
        autoFocus
        defaultValue={atividade.contato}
        placeholder="Contato"
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => {
          updateAtividade(atividade.id, { contato: e.target.value });
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-6 px-1.5 text-sm"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
    >
      <Phone className="size-3" />
      {atividade.contato || "+ contato"}
    </button>
  );
}

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
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold leading-tight">
              {empresa?.name ?? "Sem empresa"}
              {unidade && <span className="text-muted-foreground"> · {unidade.name}</span>}
            </p>
            {assunto && (
              <p className="text-sm text-muted-foreground">{assunto.name}</p>
            )}
            <QuickContato atividade={atividade} />
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

        <div
          className="flex flex-wrap items-center gap-2 font-mono text-[11px]"
          onClick={(e) => e.stopPropagation()}
        >
          <QuickStatusBadge atividade={atividade} />
          <QuickPrioridadeBadge atividade={atividade} />
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
          <QuickPrazo atividade={atividade} />
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
