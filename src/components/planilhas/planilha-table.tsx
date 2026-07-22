"use client";

import Link from "next/link";
import { Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import type { Planilha } from "@/lib/types";

export function PlanilhaTable({
  planilhas,
  onOpen,
}: {
  planilhas: Planilha[];
  onOpen: (p: Planilha) => void;
}) {
  const { lookups, atividades, deletePlanilha } = useAppData();

  return (
    <div className="panel-card overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Nome</th>
            <th className="px-3 py-2 font-medium">Empresa</th>
            <th className="px-3 py-2 font-medium">Unidade</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Assunto</th>
            <th className="px-3 py-2 font-medium">Vínculo</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {planilhas.map((p) => {
            const empresa = lookups.empresa.find((e) => e.id === p.empresaId);
            const unidade = lookups.unidade.find((u) => u.id === p.unidadeId);
            const categorias = lookups.categoriaPlanilha.filter((c) =>
              p.categoriaIds.includes(c.id)
            );
            const vinculadas = atividades.filter((a) => p.atividadeIds.includes(a.id));
            return (
              <tr
                key={p.id}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                onClick={() => onOpen(p)}
              >
                <td className="px-3 py-2 font-medium">{p.nome || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{empresa?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{unidade?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {categorias.map((c) => c.name).join(", ") || "—"}
                </td>
                <td className="max-w-56 truncate px-3 py-2 text-muted-foreground" title={p.assunto}>
                  {p.assunto || "—"}
                </td>
                <td className="px-3 py-2">
                  {vinculadas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {vinculadas.map((v) => (
                        <Link
                          key={v.id}
                          href={`/atividades?open=${v.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex w-fit items-center gap-1 rounded-full bg-[var(--base-3)] px-2 py-0.5 text-[11px] font-medium text-white hover:opacity-80"
                        >
                          <Link2 className="size-3" />
                          Atividade
                        </Link>
                      ))}
                    </div>
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
                      deletePlanilha(p.id);
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
