"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarClock,
  Trash2,
  CheckSquare,
  Phone,
  Check,
  Building2,
  FileText,
  Table2,
  Package,
} from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import {
  diasEmPendencia,
  diasEmAtraso,
  formatCurrency,
  formatLocalDateTime,
} from "@/lib/calculations";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS, STATUS_NEGOCIACAO_LABELS } from "@/lib/types";
import type { Atividade } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PRIORIDADE_STYLES,
  STATUS_STYLES,
  PRAZO_STYLES,
  PRAZO_LABELS,
  atividadePrazoStatus,
  prazoStatusFor,
  STATUS_NEGOCIACAO_STYLES,
} from "@/lib/status-colors";

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
        type="datetime-local"
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
        className="h-6 w-44 px-1.5 text-[11px]"
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
      {atividade.prazo ? `Prazo: ${formatLocalDateTime(atividade.prazo)}` : "+ prazo"}
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
      className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
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
  const { lookups, registros, planilhas, deleteAtividade, updateAtividade } = useAppData();

  const empresa = lookups.empresa.find((e) => e.id === atividade.empresaId);
  const unidade = lookups.unidade.find((u) => u.id === atividade.unidadeId);
  const tipos = lookups.tipoAtividade.filter((t) =>
    atividade.tipoAtividadeIds.includes(t.id)
  );
  const isProposta = tipos.some((t) => t.name.toLowerCase() === "proposta");
  const dias = diasEmPendencia(atividade);
  const atraso = diasEmAtraso(atividade);
  const checkTotal = atividade.checklist.length;
  const checkDone = atividade.checklist.filter((c) => c.concluido).length;
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;
  const checklistComPrazo = atividade.checklist.filter((c) => c.prazo && !c.concluido);
  const propostaTotal = atividade.propostas.reduce(
    (sum, p) => sum + (p.valorTotal ?? 0),
    0
  );

  const prazoStatus = atividadePrazoStatus(atividade);
  const concluida = atividade.status === "Concluído";

  const linkedRegistros = registros.filter((r) => r.atividadeId === atividade.id && !r.deletedAt);
  const linkedPlanilhas = planilhas.filter((p) => p.atividadeId === atividade.id && !p.deletedAt);

  return (
    <Card
      className="cursor-pointer border-l-4 border-l-[var(--base-1)] transition-shadow hover:shadow-md"
      onClick={onEdit}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            {/* 1. Empresa + Unidade */}
            <p className="flex items-center gap-1.5 font-semibold leading-tight">
              <Building2 className="size-3.5 shrink-0 text-[var(--base-1)]" />
              {empresa?.name ?? "Sem empresa"}
              {unidade && <span className="text-muted-foreground"> · {unidade.name}</span>}
            </p>
            {/* 2. Assunto (ou Serviço/Produto quando proposta) */}
            {isProposta ? (
              <ServicoProdutoDestaque atividade={atividade} />
            ) : (
              atividade.assunto && (
                <p className="text-sm text-muted-foreground">{atividade.assunto}</p>
              )
            )}
            {/* 3. Contato (menor destaque) */}
            <QuickContato atividade={atividade} />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              title={concluida ? "Reabrir atividade" : "Concluir atividade"}
              onClick={(e) => {
                e.stopPropagation();
                updateAtividade(atividade.id, { status: concluida ? "Pendente" : "Concluído" });
              }}
              className={cn(
                "flex size-7 items-center justify-center rounded-md border transition-colors",
                concluida
                  ? "border-transparent bg-[var(--status-concluido)] text-white"
                  : "border-muted-foreground/40 text-transparent hover:border-[var(--status-concluido)] hover:text-[var(--status-concluido)]"
              )}
            >
              <Check className="size-4" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteAtividade(atividade.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* 4. Tipo de atividade (etiqueta) */}
        {tipos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tipos.map((t) => (
              <Badge key={t.id} variant="outline">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        {/* 5-6. Status + Prioridade + prazo */}
        <div
          className="flex flex-wrap items-center gap-2 font-mono text-[11px]"
          onClick={(e) => e.stopPropagation()}
        >
          <QuickStatusBadge atividade={atividade} />
          <QuickPrioridadeBadge atividade={atividade} />
          {prazoStatus && (
            <span className={cn("rounded-full px-2.5 py-0.5 font-medium tracking-wide uppercase", PRAZO_STYLES[prazoStatus])}>
              {PRAZO_LABELS[prazoStatus]}
            </span>
          )}
          {dias !== null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-3.5" />
              {dias}d em pendência
            </span>
          )}
          {atraso !== null && (
            <span className={cn("rounded-full px-2.5 py-0.5 font-medium tracking-wide uppercase", PRAZO_STYLES.vencido)}>
              {atraso}d em atraso
            </span>
          )}
          <QuickPrazo atividade={atividade} />
        </div>

        {/* 7. Informações específicas por tipo */}
        {isProposta && <PropostaDetalhes atividade={atividade} propostaTotal={propostaTotal} />}

        {!isProposta && atividade.emailConteudo?.trim() &&
          tipos.some((t) => t.name.toLowerCase() === "email") && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {atividade.emailConteudo.trim()}
            </p>
          )}

        {!isProposta && atividade.oportunidadeTexto?.trim() &&
          tipos.some((t) => t.name.toLowerCase() === "oportunidade") && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {atividade.oportunidadeTexto.trim()}
            </p>
          )}

        {checklistComPrazo.length > 0 && (
          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            {checklistComPrazo.map((c) => {
              const status = prazoStatusFor(c.prazo);
              return (
                <span
                  key={c.id}
                  title={c.texto}
                  className={cn(
                    "flex max-w-40 items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-medium",
                    status ? PRAZO_STYLES[status] : "bg-muted text-muted-foreground"
                  )}
                >
                  <CheckSquare className="size-3 shrink-0" />
                  <span className="truncate">{c.texto || "Item"}</span>
                  <span className="shrink-0 opacity-80">{formatLocalDateTime(c.prazo!)}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* 8. Índice de conclusão do checklist: barra + quantidade */}
        {checkTotal > 0 && (
          <div className="flex items-center gap-2">
            <div className="progress-track flex-1">
              <span style={{ width: `${checkPct}%`, background: "var(--base-1)" }} />
            </div>
            <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <CheckSquare className="size-3.5" />
              {checkDone}/{checkTotal}
            </span>
          </div>
        )}

        {/* 9. Vínculos (registro/planilha) com direcionamento */}
        {(linkedRegistros.length > 0 || linkedPlanilhas.length > 0) && (
          <div className="flex flex-wrap gap-2 text-[11px]" onClick={(e) => e.stopPropagation()}>
            {linkedRegistros.map((r) => (
              <Link
                key={r.id}
                href={`/registros?open=${r.id}`}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground hover:underline"
              >
                <FileText className="size-3" />
                {r.nome || r.tabs[0]?.titulo || "Registro"}
              </Link>
            ))}
            {linkedPlanilhas.map((p) => (
              <Link
                key={p.id}
                href={`/planilhas?open=${p.id}`}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground hover:underline"
              >
                <Table2 className="size-3" />
                {p.nome || "Planilha"}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServicoProdutoDestaque({ atividade }: { atividade: Atividade }) {
  const { lookups } = useAppData();
  const nomes = new Set<string>();
  const detalhes = new Set<string>();
  for (const p of atividade.propostas) {
    for (const id of p.servicoProdutoIds) {
      const nome = lookups.servicoProduto.find((s) => s.id === id)?.name;
      if (nome) nomes.add(nome);
    }
    if (p.detalhe.trim()) detalhes.add(p.detalhe.trim());
  }
  if (nomes.size === 0 && detalhes.size === 0) {
    return atividade.assunto ? (
      <p className="text-sm font-medium">{atividade.assunto}</p>
    ) : null;
  }
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
      <Package className="size-3.5 shrink-0 text-[var(--base-1)]" />
      {Array.from(nomes).join(", ")}
      {detalhes.size > 0 && (
        <span className="font-normal text-muted-foreground">
          — {Array.from(detalhes).join(" · ")}
        </span>
      )}
    </p>
  );
}

function PropostaDetalhes({
  atividade,
  propostaTotal,
}: {
  atividade: Atividade;
  propostaTotal: number;
}) {
  const { lookups } = useAppData();
  const escopos = new Set<string>();
  const amostragens = new Set<string>();
  const tiposProduto = new Set<string>();
  for (const p of atividade.propostas) {
    for (const id of p.escopoIds) {
      const n = lookups.escopo.find((e) => e.id === id)?.name;
      if (n) escopos.add(n);
    }
    for (const id of p.amostragemIds) {
      const n = lookups.amostragem.find((a) => a.id === id)?.name;
      if (n) amostragens.add(n);
    }
    if (p.tipo) tiposProduto.add(p.tipo);
  }
  const propostasComNeg = atividade.propostas.filter((p) => p.statusNegociacao);

  return (
    <div className="flex flex-col gap-1.5">
      {(escopos.size > 0 || amostragens.size > 0) && (
        <p className="text-[11px] text-muted-foreground">
          {escopos.size > 0 && <span>Escopo: {Array.from(escopos).join(", ")}</span>}
          {escopos.size > 0 && amostragens.size > 0 && " · "}
          {amostragens.size > 0 && <span>Amostragem: {Array.from(amostragens).join(", ")}</span>}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        {Array.from(tiposProduto).map((t) => (
          <span
            key={t}
            className="rounded-full bg-[var(--base-4)] px-2 py-0.5 font-medium text-[var(--base-1)]"
          >
            {t}
          </span>
        ))}
        {propostasComNeg.map((p) => (
          <span
            key={p.id}
            className={cn(
              "rounded-full px-2 py-0.5 font-mono font-medium tracking-wide uppercase",
              STATUS_NEGOCIACAO_STYLES[p.statusNegociacao!]
            )}
          >
            {STATUS_NEGOCIACAO_LABELS[p.statusNegociacao!]}
          </span>
        ))}
        {propostaTotal > 0 && (
          <span className="rounded-full bg-[var(--base-3)] px-2.5 py-0.5 font-medium text-[var(--base-1)]">
            {formatCurrency(propostaTotal)}
          </span>
        )}
      </div>
    </div>
  );
}
