"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, RotateCcw, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/app-data-context";
import type { Atividade } from "@/lib/types";

export default function LixeiraPage() {
  const { lookups, refetch } = useAppData();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const a = await fetch("/api/atividades?trash=1").then((res) => (res.ok ? res.json() : []));
    setAtividades(a);
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

  async function restore(id: string) {
    await fetch(`/api/atividades/${id}/restore`, { method: "POST" });
    await load();
    refetch();
  }

  async function purge(id: string) {
    if (!window.confirm("Excluir definitivamente? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/atividades/${id}?permanent=1`, { method: "DELETE" });
    await load();
  }

  const empresaName = (id: string | null) =>
    lookups.empresa.find((e) => e.id === id)?.name ?? "Sem empresa";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Lixeira</h2>
        <p className="mt-1 text-muted-foreground">
          Itens excluídos ficam aqui até serem restaurados ou removidos definitivamente.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : atividades.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Trash2 className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">A lixeira está vazia.</p>
        </div>
      ) : (
        <section className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="size-4" />
            Atividades ({atividades.length})
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {atividades.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-2">
                  <p className="font-medium">{empresaName(a.empresaId)}</p>
                  <p className="text-sm text-muted-foreground">{a.assunto || "Sem assunto"}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => restore(a.id)}
                    >
                      <RotateCcw className="size-3.5" />
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive"
                      onClick={() => purge(a.id)}
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
    </div>
  );
}
