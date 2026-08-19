"use client";

import { Trash2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import { prazoResumo } from "@/lib/calculations";
import { camposVisiveis } from "@/lib/exibicao-config";
import { cn } from "@/lib/utils";
import type { Atividade } from "@/lib/types";
import { QuickStatusBadge, QuickPrioridadeBadge } from "@/components/atividades/activity-card";

export function ActivityTable({
  atividades,
  onEdit,
  onDuplicate,
}: {
  atividades: Atividade[];
  onEdit: (a: Atividade) => void;
  onDuplicate?: (a: Atividade) => void;
}) {
  const { lookups, deleteAtividade, updateAtividade, configuracoesVisuais } = useAppData();

  // PROMPT 3 (3.3): quais colunas aparecem e em que ordem vem da aba
  // Configurações. Ocultar uma coluna não remove o campo do cadastro.
  const colunas = camposVisiveis("lista", configuracoesVisuais);

  return (
    <div className="panel-card">
      {/* A rolagem fica num filho: .panel-card aplica overflow:hidden, que
          venceria o overflow-x-auto e cortaria a tabela sem indicação.
          Sem min-w-max: as colunas se adaptam ao espaço e o conteúdo quebra
          linha em vez de empurrar dados para fora da tela (Regra 7). */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              {colunas.map((c) => (
                <th key={c.campo} className="px-3 py-2 font-medium">
                  {c.fixo ? "" : c.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {atividades.map((a) => {
              const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
              const unidades = lookups.unidade.filter((u) => a.unidadeIds.includes(u.id));
              const tipos = lookups.tipoAtividade.filter((t) =>
                a.tipoAtividadeIds.includes(t.id)
              );
              const checkTotal = a.checklist.length;
              const checkDone = a.checklist.filter((c) => c.concluido).length;
              const concluida = a.status === "Concluído";

              const celula: Record<string, React.ReactNode> = {
                concluir: (
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
                ),
                empresa: empresa?.name ?? "—",
                unidade: unidades.map((u) => u.name).join(", ") || "—",
                tipo: tipos.map((t) => t.name).join(", ") || "—",
                assunto: a.assunto || "—",
                prazo: prazoResumo(a) ?? "—",
                status: <QuickStatusBadge atividade={a} />,
                prioridade: <QuickPrioridadeBadge atividade={a} />,
                checklist:
                  checkTotal > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="progress-track w-16">
                        <span
                          style={{
                            width: `${Math.round((checkDone / checkTotal) * 100)}%`,
                            background: "var(--base-1)",
                          }}
                        />
                      </div>
                      <span className="text-xs">
                        {checkDone}/{checkTotal}
                      </span>
                    </div>
                  ) : (
                    "—"
                  ),
                acoes: (
                  <div className="flex items-center justify-end gap-1">
                    {onDuplicate && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        title="Duplicar atividade"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(a);
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      title="Excluir atividade"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAtividade(a.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ),
              };

              // Colunas cujo clique é do próprio controle, não da linha.
              const naoAbreDetalhe = new Set(["concluir", "status", "prioridade", "acoes"]);

              return (
                <tr
                  key={a.id}
                  className={cn(
                    "cursor-pointer border-b last:border-0 hover:bg-muted/40",
                    // S16 (PROMPT 2): mesmo tratamento do card — concluídas ficam
                    // esmaecidas ao final da lista, voltando ao normal no hover.
                    concluida && "opacity-60 hover:opacity-100"
                  )}
                  onClick={() => onEdit(a)}
                >
                  {colunas.map((c) => (
                    <td
                      key={c.campo}
                      className={cn(
                        "px-3 py-2",
                        c.campo === "empresa" ? "font-medium" : "text-muted-foreground",
                        c.campo === "acoes" && "text-right",
                        (c.campo === "status" || c.campo === "prioridade") &&
                          "font-mono text-[11px] text-foreground"
                      )}
                      onClick={
                        naoAbreDetalhe.has(c.campo) ? (e) => e.stopPropagation() : undefined
                      }
                    >
                      {celula[c.campo] ?? "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
