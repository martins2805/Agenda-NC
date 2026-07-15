"use client";

import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { formatLocalDateTime } from "@/lib/calculations";
import { STATUS_STYLES, PRIORIDADE_STYLES } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import type { Atividade } from "@/lib/types";

export function ActivityTable({
  atividades,
  onEdit,
}: {
  atividades: Atividade[];
  onEdit: (a: Atividade) => void;
}) {
  const { lookups, deleteAtividade, updateAtividade } = useAppData();

  return (
    <div className="panel-card overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium" title="Concluir" />
            <th className="px-3 py-2 font-medium">Empresa</th>
            <th className="px-3 py-2 font-medium">Unidade</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Assunto</th>
            <th className="px-3 py-2 font-medium">Prazo</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Prioridade</th>
            <th className="px-3 py-2 font-medium">Checklist</th>
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
            const concluida = a.status === "Concluído";
            return (
              <tr
                key={a.id}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                onClick={() => onEdit(a)}
              >
                <td className="px-3 py-2">
                  <button
                    type="button"
                    title={concluida ? "Reabrir atividade" : "Concluir atividade"}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAtividade(a.id, { status: concluida ? "Pendente" : "Concluído" });
                    }}
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border transition-colors",
                      concluida
                        ? "border-transparent bg-[var(--status-concluido)] text-white"
                        : "border-muted-foreground/40 text-transparent hover:border-[var(--status-concluido)]"
                    )}
                  >
                    <Check className="size-3.5" />
                  </button>
                </td>
                <td className="px-3 py-2 font-medium">{empresa?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{unidade?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {tipos.map((t) => t.name).join(", ") || "—"}
                </td>
                <td className="max-w-48 truncate px-3 py-2 text-muted-foreground" title={a.assunto}>
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
                <td className="px-3 py-2 text-muted-foreground">
                  {checkTotal > 0 ? `${checkDone}/${checkTotal}` : "—"}
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
