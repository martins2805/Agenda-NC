"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Table2 } from "lucide-react";
import { useAppData, makePlanilhaId } from "@/lib/app-data-context";
import { useAutoOpenFromQuery } from "@/lib/use-auto-open";
import { PlanilhaCard } from "@/components/planilhas/planilha-card";
import { PlanilhaEditor } from "@/components/planilhas/planilha-editor";
import {
  PlanilhaFilterBar,
  DEFAULT_PLANILHA_FILTERS,
  type PlanilhaFilters,
} from "@/components/planilhas/planilha-filter-bar";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
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
  const { lookups, planilhas, loading, addPlanilha, updatePlanilha, deletePlanilha } =
    useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<Planilha | null>(null);
  const [filters, setFilters] = useState<PlanilhaFilters>(DEFAULT_PLANILHA_FILTERS);
  const [view, setView] = useState<ViewMode>("lista");

  const editing = draftNew ?? planilhas.find((p) => p.id === editingId) ?? null;

  useAutoOpenFromQuery(planilhas, loading, (p) => setEditingId(p.id));

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return planilhas.filter((p) => {
      if (filters.empresaId && p.empresaId !== filters.empresaId) return false;
      if (filters.assuntoId && p.assuntoId !== filters.assuntoId) return false;
      if (filters.categoriaId && !p.categoriaIds.includes(filters.categoriaId))
        return false;
      if (filters.vinculo === "vinculado" && !p.atividadeId) return false;
      if (filters.vinculo === "sem_vinculo" && p.atividadeId) return false;

      if (keyword) {
        const empresa = lookups.empresa.find((e) => e.id === p.empresaId)?.name ?? "";
        const assunto = lookups.assunto.find((a) => a.id === p.assuntoId)?.name ?? "";
        const haystack = [p.nome, empresa, assunto].join(" ").toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [planilhas, filters, lookups]);

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
  const semCategoria = filtered.filter((p) => p.categoriaIds.length === 0);
  const columns = [
    ...activeCategorias.map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: filtered.filter((p) => p.categoriaIds.includes(cat.id)),
    })),
    ...(semCategoria.length > 0
      ? [{ id: "__sem_categoria__", name: "Sem categoria", items: semCategoria }]
      : []),
  ].filter((col) => col.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
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

      <PlanilhaFilterBar filters={filters} onChange={setFilters} />
      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Table2 className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            {planilhas.length === 0
              ? "Nenhuma planilha cadastrada ainda."
              : "Nenhuma planilha encontrada com esses filtros."}
          </p>
        </div>
      ) : view === "lista" ? (
        <div className="flex flex-col gap-8">
          {columns.map((col) => (
            <section key={col.id} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{col.name}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {col.items.map((p) => (
                  <PlanilhaCard
                    key={p.id}
                    planilha={p}
                    onOpen={() => setEditingId(p.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((col) => (
            <div key={col.id} className="flex w-72 shrink-0 flex-col gap-3">
              <p className="text-sm font-semibold">
                {col.name}{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  ({col.items.length})
                </span>
              </p>
              <div className="flex flex-col gap-3">
                {col.items.map((p) => (
                  <PlanilhaCard
                    key={p.id}
                    planilha={p}
                    onOpen={() => setEditingId(p.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
