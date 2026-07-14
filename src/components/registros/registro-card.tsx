"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Link2 } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { tileColorFor } from "@/lib/tile-colors";
import { cn } from "@/lib/utils";
import type { Registro } from "@/lib/types";

export function RegistroCard({
  registro,
  onOpen,
}: {
  registro: Registro;
  onOpen: () => void;
}) {
  const { lookups, atividades } = useAppData();

  const empresa = lookups.empresa.find((e) => e.id === registro.empresaId);
  const assunto = registro.assunto;
  const categorias = lookups.categoriaRegistro.filter((c) =>
    registro.categoriaIds.includes(c.id)
  );
  const atividadeVinculada = atividades.find((a) => a.id === registro.atividadeId);
  const atividadeLabel = atividadeVinculada
    ? [
        lookups.empresa.find((e) => e.id === atividadeVinculada.empresaId)?.name,
        atividadeVinculada.assunto,
      ]
        .filter(Boolean)
        .join(" · ") || "Atividade vinculada"
    : null;

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onOpen}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold leading-tight">
              {registro.nome || empresa?.name || "Registro sem nome"}
            </p>
            <p className="text-sm text-muted-foreground">
              {[empresa?.name, assunto].filter(Boolean).join(" · ") || "Sem empresa/assunto"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {categorias.map((c) => (
            <span
              key={c.id}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                tileColorFor(c.id)
              )}
            >
              {c.name}
            </span>
          ))}
        </div>
        {atividadeLabel && (
          <Link
            href={`/atividades?open=${registro.atividadeId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex w-fit items-center gap-1 rounded-full bg-[var(--chart-5)] px-2.5 py-0.5 text-xs font-medium text-[var(--chart-1)] hover:opacity-80"
          >
            <Link2 className="size-3" />
            {atividadeLabel}
          </Link>
        )}
        <p className="text-xs text-muted-foreground">
          {registro.tabs.length} {registro.tabs.length === 1 ? "aba" : "abas"}
        </p>
      </CardContent>
    </Card>
  );
}
