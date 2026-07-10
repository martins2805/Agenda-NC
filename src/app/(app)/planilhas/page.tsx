"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Table2 } from "lucide-react";
import { useAppData, makePlanilhaId } from "@/lib/app-data-context";
import { PlanilhaCard } from "@/components/planilhas/planilha-card";
import { PlanilhaEditor } from "@/components/planilhas/planilha-editor";
import { PageHero } from "@/components/page-hero";
import type { Planilha } from "@/lib/types";

function emptyPlanilha(): Planilha {
  return {
    id: makePlanilhaId(),
    nome: "Nova planilha",
    empresaId: null,
    unidadeId: null,
    assuntoId: null,
    categoriaIds: [],
    atividadeId: null,
    conteudo: null,
    createdAt: new Date().toISOString(),
  };
}

export default function PlanilhasPage() {
  const { lookups, planilhas, addPlanilha, updatePlanilha, deletePlanilha } =
    useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<Planilha | null>(null);

  const editing = draftNew ?? planilhas.find((p) => p.id === editingId) ?? null;

  function openNew() {
    const planilha = emptyPlanilha();
    setDraftNew(planilha);
    setEditingId(planilha.id);
  }

  function handleChange(planilha: Planilha) {
    if (draftNew && draftNew.id === planilha.id) {
      addPlanilha(planilha);
      setDraftNew(null);
    } else {
      updatePlanilha(planilha.id, planilha);
    }
  }

  function handleBack() {
    setEditingId(null);
    setDraftNew(null);
  }

  function handleDelete() {
    if (editingId && !draftNew) deletePlanilha(editingId);
    handleBack();
  }

  if (editing) {
    return (
      <PlanilhaEditor
        planilha={editing}
        onChange={handleChange}
        onBack={handleBack}
        onDelete={handleDelete}
      />
    );
  }

  const activeCategorias = lookups.categoriaPlanilha.filter((c) => c.active);
  const semCategoria = planilhas.filter((p) => p.categoriaIds.length === 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        icon={<Table2 className="size-3.5" />}
        label="Biblioteca · Planilhas"
        title="Planilhas livres para virar processo."
        description="Grade estilo Excel/Sheets com fórmulas reais, abas, metadados e associação como anexo de atividades."
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planilhas</h2>
          <p className="mt-1 text-muted-foreground">
            Organizadas por categoria: vendas, comissão, faturamento, dados e consultoria.
          </p>
        </div>
        <Button className="gap-2 sm:w-fit" onClick={openNew}>
          <Plus className="size-4" />
          Nova planilha
        </Button>
      </div>

      {planilhas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Table2 className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhuma planilha cadastrada ainda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {activeCategorias.map((cat) => {
            const items = planilhas.filter((p) => p.categoriaIds.includes(cat.id));
            if (items.length === 0) return null;
            return (
              <section key={cat.id} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">{cat.name}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => (
                    <PlanilhaCard
                      key={p.id}
                      planilha={p}
                      onOpen={() => setEditingId(p.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {semCategoria.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Sem categoria</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {semCategoria.map((p) => (
                  <PlanilhaCard
                    key={p.id}
                    planilha={p}
                    onOpen={() => setEditingId(p.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
