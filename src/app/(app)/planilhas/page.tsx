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
    assunto: "",
    categoriaIds: [],
    atividadeIds: [],
    conteudo: null,
    createdAt: new Date().toISOString(),
  };
}

export default function PlanilhasPage() {
  const { lookups, atividades, planilhas, loading, addPlanilha, updatePlanilha, deletePlanilha } =
    useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<Planilha | null>(null);
  const [filters, setFilters] = useState<PlanilhaFilters>(DEFAULT_PLANILHA_FILTERS);
  const [view, setView] = useState<ViewMode>("cards");

  const editing = draftNew ?? planilhas.find((p) => p.id === editingId) ?? null;

  useAutoOpenFromQuery(planilhas, loading, (p) => setEditingId(p.id));

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return planilhas.filter((p) => {
      if (filters.empresaId && p.empresaId !== filters.empresaId) return false;
      if (filters.categoriaId && !p.categoriaIds.includes(filters.categoriaId))
        return false;
      if (filters.vinculo === "vinculado" && p.atividadeIds.length === 0) return false;
      if (filters.vinculo === "sem_vinculo" && p.atividadeIds.length > 0) return false;

      if (keyword) {
        const empresa = lookups.empresa.find((e) => e.id === p.empresaId)?.name ?? "";
        const assunto = p.assunto;
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Planilhas</h2>
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
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <PlanilhaCard
              key={p.id}
              planilha={p}
              onOpen={() => setEditingId(p.id)}
            />
          ))}
        </div>
      ) : (
        <div className="panel-card overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Unidade</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Assunto</th>
                <th className="px-3 py-2">Vinculo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const empresa = lookups.empresa.find((e) => e.id === p.empresaId)?.name ?? "Sem empresa";
                const unidade = lookups.unidade.find((u) => u.id === p.unidadeId)?.name ?? "-";
                const assunto = p.assunto || "-";
                const categorias = lookups.categoriaPlanilha
                  .filter((c) => p.categoriaIds.includes(c.id))
                  .map((c) => c.name)
                  .join(", ") || "-";
                const vinculadas = atividades.filter((a) => p.atividadeIds.includes(a.id));
                const vinculo =
                  vinculadas.length === 0
                    ? "-"
                    : vinculadas.length === 1
                      ? lookups.empresa.find((e) => e.id === vinculadas[0].empresaId)?.name ?? "Atividade vinculada"
                      : `${vinculadas.length} atividades`;
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer border-t hover:bg-muted/30"
                    onClick={() => setEditingId(p.id)}
                  >
                    <td className="px-3 py-2 font-medium">{p.nome || "Planilha"}</td>
                    <td className="px-3 py-2">{empresa}</td>
                    <td className="px-3 py-2">{unidade}</td>
                    <td className="px-3 py-2">{categorias}</td>
                    <td className="px-3 py-2">{assunto}</td>
                    <td className="px-3 py-2">{vinculo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
