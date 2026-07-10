"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Link2 } from "lucide-react";
import { useAppData } from "@/lib/app-data-context";
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
  const assunto = lookups.assunto.find((a) => a.id === registro.assuntoId);
  const categorias = lookups.categoriaRegistro.filter((c) =>
    registro.categoriaIds.includes(c.id)
  );
  const atividadeVinculada = atividades.find((a) => a.id === registro.atividadeId);
  const atividadeLabel = atividadeVinculada
    ? [
        lookups.empresa.find((e) => e.id === atividadeVinculada.empresaId)?.name,
        lookups.assunto.find((s) => s.id === atividadeVinculada.assuntoId)?.name,
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
              {empresa?.name ?? "Sem empresa"}
            </p>
            {assunto && <p className="text-sm text-muted-foreground">{assunto.name}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {categorias.map((c) => (
            <Badge key={c.id} variant="outline">
              {c.name}
            </Badge>
          ))}
        </div>
        {atividadeLabel && (
          <Link
            href={`/atividades?open=${registro.atividadeId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 self-start"
          >
            <Badge
              variant="secondary"
              className="gap-1 text-primary hover:underline"
            >
              <Link2 className="size-3" />
              {atividadeLabel}
            </Badge>
          </Link>
        )}
        <p className="text-xs text-muted-foreground">
          {registro.tabs.length} {registro.tabs.length === 1 ? "aba" : "abas"}
        </p>
      </CardContent>
    </Card>
  );
}
