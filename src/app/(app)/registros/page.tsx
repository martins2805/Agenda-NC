"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useAppData, makeRegistroId, makeRegistroTabId } from "@/lib/app-data-context";
import { RegistroCard } from "@/components/registros/registro-card";
import { RegistroEditor } from "@/components/registros/registro-editor";
import type { Registro } from "@/lib/types";

function emptyRegistro(): Registro {
  return {
    id: makeRegistroId(),
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
  const { lookups, registros, addRegistro, updateRegistro, deleteRegistro } =
    useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<Registro | null>(null);

  const editing = draftNew ?? registros.find((r) => r.id === editingId) ?? null;

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

  const activeCategorias = lookups.categoriaRegistro.filter((c) => c.active);
  const semCategoria = registros.filter((r) => r.categoriaIds.length === 0);

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

      {registros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhum registro cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {activeCategorias.map((cat) => {
            const items = registros.filter((r) => r.categoriaIds.includes(cat.id));
            if (items.length === 0) return null;
            return (
              <section key={cat.id} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">{cat.name}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((r) => (
                    <RegistroCard
                      key={r.id}
                      registro={r}
                      onOpen={() => setEditingId(r.id)}
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
                {semCategoria.map((r) => (
                  <RegistroCard
                    key={r.id}
                    registro={r}
                    onOpen={() => setEditingId(r.id)}
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
