"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table2, Link2 } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
import type { Planilha } from "@/lib/types";

export function PlanilhaCard({
  planilha,
  onOpen,
}: {
  planilha: Planilha;
  onOpen: () => void;
}) {
  const { lookups } = useAppData();

  const empresa = lookups.empresa.find((e) => e.id === planilha.empresaId);
  const assunto = lookups.assunto.find((a) => a.id === planilha.assuntoId);
  const categorias = lookups.categoriaPlanilha.filter((c) =>
    planilha.categoriaIds.includes(c.id)
  );

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onOpen}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <Table2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold leading-tight">{planilha.nome}</p>
            <p className="text-sm text-muted-foreground">
              {empresa?.name ?? "Sem empresa"}
              {assunto && ` · ${assunto.name}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {categorias.map((c) => (
            <Badge key={c.id} variant="outline">
              {c.name}
            </Badge>
          ))}
          {planilha.atividadeId && (
            <Badge variant="secondary" className="gap-1">
              <Link2 className="size-3" />
              Vinculado
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
