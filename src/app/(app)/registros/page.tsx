"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useAppData, makeRegistroId, makeRegistroTabId } from "@/lib/app-data-context";
import { useAutoOpenFromQuery } from "@/lib/use-auto-open";
import { RegistroCard } from "@/components/registros/registro-card";
import { RegistroEditor } from "@/components/registros/registro-editor";
import {
  RegistroFilterBar,
  DEFAULT_REGISTRO_FILTERS,
  type RegistroFilters,
} from "@/components/registros/registro-filter-bar";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import type { Registro } from "@/lib/types";

function emptyRegistro(): Registro {
  return {
    id: makeRegistroId(),
    nome: "",
    empresaId: null,
    unidadeId: null,
    contato: "",
    assuntoId: null,
    categoriaIds: [],
    tabs: [{ id: makeRegistroTabId(), titulo: "Aba 1", conteudo: "" }],
    atividadeId: null,
    createdAt: new Date().toISOString(),
  };
}

export default function RegistrosPage() {
  const { lookups, atividades, registros, loading, addRegistro, updateRegistro, deleteRegistro } =
    useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<Registro | null>(null);
  const [filters, setFilters] = useState<RegistroFilters>(DEFAULT_REGISTRO_FILTERS);
  const [view, setView] = useState<ViewMode>("cards");

  const editing = draftNew ?? registros.find((r) => r.id === editingId) ?? null;

  useAutoOpenFromQuery(registros, loading, (r) => setEditingId(r.id));

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return registros.filter((r) => {
      if (filters.empresaId && r.empresaId !== filters.empresaId) return false;
      if (filters.assuntoId && r.assuntoId !== filters.assuntoId) return false;
      if (filters.categoriaId && !r.categoriaIds.includes(filters.categoriaId))
        return false;
      if (filters.vinculo === "vinculado" && !r.atividadeId) return false;
      if (filters.vinculo === "sem_vinculo" && r.atividadeId) return false;

      if (keyword) {
        const empresa = lookups.empresa.find((e) => e.id === r.empresaId)?.name ?? "";
        const assunto = lookups.assunto.find((a) => a.id === r.assuntoId)?.name ?? "";
        const haystack = [r.nome, r.contato, empresa, assunto].join(" ").toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [registros, filters, lookups]);

  function openNew() {
    const registro = emptyRegistro();
    setDraftNew(registro);
    setEditingId(registro.id);
  }

  function handleChange(registro: Registro) {
    if (draftNew && draftNew.id === registro.id) {
      addRegistro(registro);
      setDraftNew(null);
    } else {
      updateRegistro(registro.id, registro);
    }
  }

  function handleBack() {
    setEditingId(null);
    setDraftNew(null);
  }

  function handleDelete() {
    if (editingId && !draftNew) deleteRegistro(editingId);
    handleBack();
  }

  if (editing) {
    return (
      <RegistroEditor
        registro={editing}
        onChange={handleChange}
        onBack={handleBack}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Registros</h2>
          <p className="mt-1 text-muted-foreground">
            Organizados por categoria, como uma biblioteca operacional.
          </p>
        </div>
        <Button className="gap-2 sm:w-fit" onClick={openNew}>
          <Plus className="size-4" />
          Novo registro
        </Button>
      </div>

      <RegistroFilterBar filters={filters} onChange={setFilters} />
      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            {registros.length === 0
              ? "Nenhum registro cadastrado ainda."
              : "Nenhum registro encontrado com esses filtros."}
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RegistroCard
              key={r.id}
              registro={r}
              onOpen={() => setEditingId(r.id)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
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
              {filtered.map((r) => {
                const empresa = lookups.empresa.find((e) => e.id === r.empresaId)?.name ?? "Sem empresa";
                const unidade = lookups.unidade.find((u) => u.id === r.unidadeId)?.name ?? "-";
                const assunto = lookups.assunto.find((a) => a.id === r.assuntoId)?.name ?? "-";
                const categorias = lookups.categoriaRegistro
                  .filter((c) => r.categoriaIds.includes(c.id))
                  .map((c) => c.name)
                  .join(", ") || "-";
                const atividade = atividades.find((a) => a.id === r.atividadeId);
                const vinculo = atividade
                  ? lookups.empresa.find((e) => e.id === atividade.empresaId)?.name ?? "Atividade vinculada"
                  : "-";
                return (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-t hover:bg-muted/30"
                    onClick={() => setEditingId(r.id)}
                  >
                    <td className="px-3 py-2 font-medium">{r.nome || r.tabs[0]?.titulo || "Registro"}</td>
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
