"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks } from "lucide-react";
import { useAppData, makeAtividadeId, makePropostaId, makeChecklistItemId, makeLinkId } from "@/lib/app-data-context";
import { useAutoOpenFromQuery } from "@/lib/use-auto-open";
import { useViewMode } from "@/lib/use-view-mode";
import { FilterBar } from "@/components/atividades/filter-bar";
import { ActivityCard } from "@/components/atividades/activity-card";
import { ActivityTable } from "@/components/atividades/activity-table";
import { ActivityForm } from "@/components/atividades/activity-form";
import { ViewToggle } from "@/components/view-toggle";
import { Pagination } from "@/components/ui/pagination";
import {
  matchesActivity,
  sortActivities,
  filtersToParams,
  paramsToFilters,
  type ActivityFilters,
} from "@/lib/activity-filters";
import type { Atividade } from "@/lib/types";

const PAGE_SIZE = 60;

export default function AtividadesPage() {
  const { lookups, atividades, loading, addAtividade } = useAppData();
  // Fonte dos filtros de entrada é o searchParams do router (não
  // window.location), para que o direcionamento do dashboard funcione também
  // quando já estamos em /atividades — trocar só a query string não remonta o
  // componente, então ler a URL apenas no inicializador do useState ignorava
  // silenciosamente os filtros do link (bug do PROMPT 2, corrigido na S16).
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ActivityFilters>(() =>
    paramsToFilters(new URLSearchParams(searchParams.toString()))
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | null>(null);
  const [view, setView] = useViewMode("atividades-view");
  const [page, setPage] = useState(1);
  // Última query string escrita por esta tela — usada para distinguir "a URL
  // mudou porque o usuário mexeu num filtro aqui" (ignorar) de "a URL mudou
  // por uma navegação de fora" (adotar os filtros do link).
  const escritoPorNos = useRef<string | null>(null);

  useAutoOpenFromQuery(atividades, loading, (a) => {
    setEditing(a);
    setFormOpen(true);
  });

  useEffect(() => {
    const recebido = searchParams.toString();
    if (recebido === escritoPorNos.current) return;
    setFilters(paramsToFilters(new URLSearchParams(recebido)));
    setPage(1);
  }, [searchParams]);

  // A URL reflete o estado de filtros — colar em outra aba reproduz a
  // mesma lista. history.replaceState (sem navegação Next) evita refetch.
  useEffect(() => {
    const params = filtersToParams(filters);
    // `open` não é um filtro, mas é lido por useAutoOpenFromQuery só DEPOIS
    // que os dados carregam. Sem preservá-lo aqui, esta reescrita (que roda
    // na montagem, antes disso) apagava o parâmetro e o deep-link do
    // calendário/busca global nunca abria a atividade — S16.
    const open = new URLSearchParams(window.location.search).get("open");
    if (open) params.set("open", open);
    const qs = params.toString();
    escritoPorNos.current = qs;
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [filters]);

  function handleFiltersChange(next: ActivityFilters) {
    setFilters(next);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const list = atividades.filter((a) => matchesActivity(a, filters, lookups));
    return sortActivities(list, filters.ordenar);
  }, [atividades, filters, lookups]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openEdit(a: Atividade) {
    setEditing(a);
    setFormOpen(true);
  }

  function duplicar(a: Atividade) {
    // Checklist pode ter subitens (parentId) — remapeia os ids em par para
    // não deixar um subitem apontando para o id antigo do pai.
    const idMap = new Map(a.checklist.map((c) => [c.id, makeChecklistItemId()]));
    addAtividade({
      ...a,
      id: makeAtividadeId(),
      assunto: a.assunto ? `${a.assunto} (cópia)` : "",
      status: "Pendente",
      concluidoEm: null,
      createdAt: new Date().toISOString(),
      propostas: a.propostas.map((p) => ({ ...p, id: makePropostaId() })),
      checklist: a.checklist.map((c) => ({
        ...c,
        id: idMap.get(c.id)!,
        parentId: c.parentId ? (idMap.get(c.parentId) ?? null) : null,
        concluido: false,
      })),
      links: a.links.map((l) => ({ ...l, id: makeLinkId() })),
      anexos: [],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Atividades</h2>
          <p className="mt-1 text-muted-foreground">
            Filtros combinados, ordenação e conclusão direta na lista.
          </p>
        </div>
        <Button
          className="gap-2 sm:w-fit"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova atividade
        </Button>
      </div>

      <FilterBar filters={filters} onChange={handleFiltersChange} showProduto showOrder />
      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
          <ListChecks className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            {atividades.length === 0
              ? "Nenhuma atividade cadastrada ainda."
              : "Nenhuma atividade encontrada com esses filtros."}
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((a) => (
            <ActivityCard key={a.id} atividade={a} onEdit={() => openEdit(a)} onDuplicate={() => duplicar(a)} />
          ))}
        </div>
      ) : (
        <ActivityTable atividades={paged} onEdit={openEdit} onDuplicate={duplicar} />
      )}

      {filtered.length > PAGE_SIZE && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <ActivityForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </div>
  );
}
