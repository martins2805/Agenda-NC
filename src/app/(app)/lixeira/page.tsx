"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, RotateCcw, ClipboardList, FileText, Table2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade, Registro, Planilha } from "@/lib/types";

interface TrashState {
  atividades: Atividade[];
  registros: Registro[];
  planilhas: Planilha[];
}

const EMPTY: TrashState = { atividades: [], registros: [], planilhas: [] };

export default function LixeiraPage() {
  const { lookups, refetch } = useAppData();
  const [trash, setTrash] = useState<TrashState>(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, r, p] = await Promise.all([
      fetch("/api/atividades?trash=1").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/registros?trash=1").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/planilhas?trash=1").then((res) => (res.ok ? res.json() : [])),
    ]);
    setTrash({ atividades: a, registros: r, planilhas: p });
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!cancelled) await load();
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function restore(kind: "atividades" | "registros" | "planilhas", id: string) {
    await fetch(`/api/${kind}/${id}/restore`, { method: "POST" });
    await load();
    refetch();
  }

  async function purge(kind: "atividades" | "registros" | "planilhas", id: string) {
    if (!window.confirm("Excluir definitivamente? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/${kind}/${id}?permanent=1`, { method: "DELETE" });
    await load();
  }

  const empresaName = (id: string | null) =>
    lookups.empresa.find((e) => e.id === id)?.name ?? "Sem empresa";

  const isEmpty =
    trash.atividades.length === 0 && trash.registros.length === 0 && trash.planilhas.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Lixeira</h2>
        <p className="mt-1 text-muted-foreground">
          Itens excluídos ficam aqui até serem restaurados ou removidos definitivamente.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Trash2 className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">A lixeira está vazia.</p>
        </div>
      ) : (
        <>
          {trash.atividades.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <ClipboardList className="size-4" />
                Atividades ({trash.atividades.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {trash.atividades.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="flex flex-col gap-2">
                      <p className="font-medium">{empresaName(a.empresaId)}</p>
                      <p className="text-sm text-muted-foreground">{a.assunto || "Sem assunto"}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => restore("atividades", a.id)}
                        >
                          <RotateCcw className="size-3.5" />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive"
                          onClick={() => purge("atividades", a.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Excluir definitivamente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {trash.registros.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="size-4" />
                Registros ({trash.registros.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {trash.registros.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="flex flex-col gap-2">
                      <p className="font-medium">{empresaName(r.empresaId)}</p>
                      <p className="text-sm text-muted-foreground">{r.assunto || "Sem assunto"}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => restore("registros", r.id)}
                        >
                          <RotateCcw className="size-3.5" />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive"
                          onClick={() => purge("registros", r.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Excluir definitivamente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {trash.planilhas.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Table2 className="size-4" />
                Planilhas ({trash.planilhas.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {trash.planilhas.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="flex flex-col gap-2">
                      <p className="font-medium">{p.nome || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{empresaName(p.empresaId)}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => restore("planilhas", p.id)}
                        >
                          <RotateCcw className="size-3.5" />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-destructive"
                          onClick={() => purge("planilhas", p.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Excluir definitivamente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
