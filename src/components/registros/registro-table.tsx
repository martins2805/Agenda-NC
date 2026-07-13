"use client";

import Link from "next/link";
import { Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import type { Registro } from "@/lib/types";

export function RegistroTable({
  registros,
  onOpen,
}: {
  registros: Registro[];
  onOpen: (r: Registro) => void;
}) {
  const { lookups, atividades, deleteRegistro } = useAppData();

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
          {registros.map((r) => {
            const empresa = lookups.empresa.find((e) => e.id === r.empresaId);
            const unidade = lookups.unidade.find((u) => u.id === r.unidadeId);
            const categorias = lookups.categoriaRegistro.filter((c) =>
              r.categoriaIds.includes(c.id)
            );
            const vinculada = atividades.find((a) => a.id === r.atividadeId);
            return (
              <tr
                key={r.id}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                onClick={() => onOpen(r)}
              >
                <td className="px-3 py-2 font-medium">{r.nome || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{empresa?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{unidade?.name ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {categorias.map((c) => c.name).join(", ") || "—"}
                </td>
                <td
                  className="max-w-64 min-w-40 px-3 py-2 whitespace-normal break-words text-muted-foreground"
                  title={r.assunto}
                >
                  {r.assunto || "—"}
                </td>
                <td className="px-3 py-2">
                  {vinculada ? (
                    <Link
                      href={`/atividades?open=${vinculada.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex w-fit items-center gap-1 rounded-full bg-[var(--base-3)] px-2 py-0.5 text-[11px] font-medium text-[var(--base-1)] hover:opacity-80"
                    >
                      <Link2 className="size-3" />
                      Atividade
                    </Link>
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
                      deleteRegistro(r.id);
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
