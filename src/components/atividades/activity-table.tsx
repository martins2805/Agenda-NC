"use client";

import { Trash2, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { diasEmAtraso, formatLocalDateTime } from "@/lib/calculations";
import {
  STATUS_STYLES,
  PRIORIDADE_STYLES,
  PRAZO_STYLES,
  STATUS_NEGOCIACAO_STYLES,
  prazoStatusFor,
} from "@/lib/status-colors";
import { STATUS_NEGOCIACAO_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Atividade } from "@/lib/types";

export function ActivityTable({
  atividades,
  onEdit,
}: {
  atividades: Atividade[];
  onEdit: (a: Atividade) => void;
}) {
  const { lookups, deleteAtividade } = useAppData();

  return (
    <div className="panel-card overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Empresa</th>
            <th className="px-3 py-2 font-medium">Unidade</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Assunto</th>
            <th className="px-3 py-2 font-medium">Prazo</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Prioridade</th>
            <th className="px-3 py-2 font-medium">Negociação</th>
            <th className="px-3 py-2 font-medium">Checklist</th>
            <th className="px-3 py-2 font-medium">Prazos checklist</th>
            <th className="px-3 py-2 font-medium">Dias em atraso</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {atividades.map((a) => {
            const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
            const unidade = lookups.unidade.find((u) => u.id === a.unidadeId);
            const tipos = lookups.tipoAtividade.filter((t) =>
              a.tipoAtividadeIds.includes(t.id)
            );
            const checkTotal = a.checklist.length;
            const checkDone = a.checklist.filter((c) => c.concluido).length;
            const checklistComPrazo = a.checklist.filter((c) => c.prazo && !c.concluido);
            const statusNegociacao = Array.from(
              new Set(a.propostas.map((p) => p.statusNegociacao).filter((s) => s !== null))
            );
            const atraso = diasEmAtraso(a);
            return (
              <tr
                key={a.id}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                onClick={() => onEdit(a)}
              >
                <td className="px-3 py-2 font-medium">{empresa?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{unidade?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {tipos.map((t) => t.name).join(", ") || "—"}
                </td>
                <td
                  className="max-w-64 min-w-40 px-3 py-2 whitespace-normal break-words text-muted-foreground"
                  title={a.assunto}
                >
                  {a.assunto || "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {a.prazo ? formatLocalDateTime(a.prazo) : "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
                      STATUS_STYLES[a.status]
                    )}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
                      PRIORIDADE_STYLES[a.prioridade]
                    )}
                  >
                    {a.prioridade}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {statusNegociacao.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {statusNegociacao.map((s) => (
                        <span
                          key={s}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                            STATUS_NEGOCIACAO_STYLES[s!]
                          )}
                        >
                          {STATUS_NEGOCIACAO_LABELS[s!]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {checkTotal > 0 ? `${checkDone}/${checkTotal} (${Math.round((checkDone / checkTotal) * 100)}%)` : "—"}
                </td>
                <td className="min-w-48 px-3 py-2">
                  {checklistComPrazo.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {checklistComPrazo.map((c) => {
                        const status = prazoStatusFor(c.prazo);
                        return (
                          <span
                            key={c.id}
                            className={cn(
                              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium break-words whitespace-normal",
                              status ? PRAZO_STYLES[status] : "bg-muted text-muted-foreground"
                            )}
                          >
                            <CheckSquare className="size-3 shrink-0" />
                            <span>{c.texto || "Item"}</span>
                            <span className="shrink-0 opacity-80">
                              {formatLocalDateTime(c.prazo!)}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {atraso !== null ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
                        PRAZO_STYLES.vencido
                      )}
                    >
                      {atraso}d
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAtividade(a.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
