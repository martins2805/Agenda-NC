"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table2, Link2, Trash2 } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import { tileColorFor } from "@/lib/tile-colors";
import { cn } from "@/lib/utils";
import type { Planilha } from "@/lib/types";

export function PlanilhaCard({
  planilha,
  onOpen,
}: {
  planilha: Planilha;
  onOpen: () => void;
}) {
  const { lookups, atividades, deletePlanilha } = useAppData();

  const empresa = lookups.empresa.find((e) => e.id === planilha.empresaId);
  const categorias = lookups.categoriaPlanilha.filter((c) =>
    planilha.categoriaIds.includes(c.id)
  );
  const atividadesVinculadas = atividades.filter((a) => planilha.atividadeIds.includes(a.id));
  const atividadeLabels = atividadesVinculadas.map(
    (a) =>
      [lookups.empresa.find((e) => e.id === a.empresaId)?.name, a.assunto]
        .filter(Boolean)
        .join(" · ") || "Atividade vinculada"
  );

  return (
    <Card
      className="cursor-pointer border-l-4 border-l-[var(--base-1)] transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Table2 className="mt-0.5 size-4 shrink-0 text-[var(--base-1)]" />
            <div>
              <p className="font-semibold leading-tight">{planilha.nome}</p>
              <p className="text-sm text-muted-foreground">
                {empresa?.name ?? "Sem empresa"}
                {planilha.assunto && ` · ${planilha.assunto}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deletePlanilha(planilha.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
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
        {atividadesVinculadas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {atividadesVinculadas.map((a, i) => (
              <Link
                key={a.id}
                href={`/atividades?open=${a.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex w-fit items-center gap-1 rounded-full bg-[var(--base-3)] px-2.5 py-0.5 text-xs font-medium text-white hover:opacity-80"
              >
                <Link2 className="size-3" />
                {atividadeLabels[i]}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
