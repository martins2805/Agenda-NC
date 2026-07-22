"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Link2, Plus, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManagedSelect } from "@/components/managed-select";
import { ManagedMultiSelect } from "@/components/managed-multi-select";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { ActivityForm } from "@/components/atividades/activity-form";
import { useAppData, useAssuntoSuggestions } from "@/lib/app-data-context";
import type { Planilha } from "@/lib/types";

const UniverSheet = dynamic(
  () => import("@/components/planilhas/univer-sheet").then((m) => m.UniverSheet),
  { ssr: false }
);

interface PlanilhaEditorProps {
  planilha: Planilha;
  onChange: (planilha: Planilha) => void;
  onBack: () => void;
  onDelete: () => void;
}

export function PlanilhaEditor({
  planilha,
  onChange,
  onBack,
  onDelete,
}: PlanilhaEditorProps) {
  const {
    lookups,
    atividades,
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
  } = useAppData();
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const assuntoSuggestions = useAssuntoSuggestions();

  function patch(p: Partial<Planilha>) {
    onChange({ ...planilha, ...p });
  }

  const linkedAtividades = atividades.filter((a) => planilha.atividadeIds.includes(a.id));

  function atividadeLabel(a: (typeof atividades)[number]) {
    const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
    return [empresa?.name, a.assunto].filter(Boolean).join(" · ") || "Atividade sem empresa/assunto";
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Excluir planilha
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Nome da planilha</Label>
        <Input
          value={planilha.nome}
          onChange={(e) => patch({ nome: e.target.value })}
          placeholder="Ex: Comissões — Julho 2026"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ManagedSelect
          label="Empresa"
          items={lookups.empresa}
          value={planilha.empresaId}
          onChange={(id) =>
            patch(
              id === planilha.empresaId
                ? { empresaId: id }
                : { empresaId: id, unidadeId: null }
            )
          }
          onCreate={(name) => addLookupItem("empresa", name)}
          onRename={(id, name) => renameLookupItem("empresa", id, name)}
          onDeactivate={(id) => deactivateLookupItem("empresa", id)}
        />
        <ManagedSelect
          label="Unidade"
          items={lookups.unidade.filter(
            (u) => !u.empresaId || u.empresaId === planilha.empresaId
          )}
          value={planilha.unidadeId}
          onChange={(id) => patch({ unidadeId: id })}
          onCreate={(name) => addLookupItem("unidade", name, planilha.empresaId)}
          onRename={(id, name) => renameLookupItem("unidade", id, name)}
          onDeactivate={(id) => deactivateLookupItem("unidade", id)}
        />
        <div className="flex flex-col gap-1.5">
          <Label>Assunto</Label>
          <Input
            list="assunto-sugestoes-planilha"
            value={planilha.assunto}
            onChange={(e) => patch({ assunto: e.target.value })}
            placeholder="Descreva o assunto em poucas palavras"
          />
          <datalist id="assunto-sugestoes-planilha">
            {assuntoSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <ManagedMultiSelect
        label="Tipo / categoria"
        items={lookups.categoriaPlanilha}
        value={planilha.categoriaIds}
        onChange={(ids) => patch({ categoriaIds: ids })}
        onCreate={(name) => addLookupItem("categoriaPlanilha", name)}
        onRename={(id, name) => renameLookupItem("categoriaPlanilha", id, name)}
        onDeactivate={(id) => deactivateLookupItem("categoriaPlanilha", id)}
      />

      <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
        <Label className="flex items-center gap-1.5">
          <Link2 className="size-3.5" />
          Atividade vinculada (anexo)
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-full sm:flex-1">
            <FilterMultiSelect
              placeholder="Nenhuma atividade vinculada"
              options={atividades.map((a) => ({ value: a.id, label: atividadeLabel(a) }))}
              value={planilha.atividadeIds}
              onChange={(ids) => patch({ atividadeIds: ids })}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-1.5"
            onClick={() => setActivityFormOpen(true)}
          >
            <Plus className="size-4" />
            Nova atividade
          </Button>
        </div>
        {linkedAtividades.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Vinculado a {linkedAtividades.length === 1 ? "1 atividade" : `${linkedAtividades.length} atividades`}
            {linkedAtividades.length === 1 ? ` (status "${linkedAtividades[0].status}")` : ""}.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Planilha</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <Minimize2 className="size-3.5" />
                Reduzir
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5" />
                Expandir
              </>
            )}
          </Button>
        </div>
        <UniverSheet
          workbookId={planilha.id}
          workbookName={planilha.nome || "Planilha"}
          initialData={planilha.conteudo}
          onChange={(conteudo) => patch({ conteudo })}
          className={expanded ? "h-[85vh]" : "h-[520px]"}
        />
      </div>

      <ActivityForm
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        editing={null}
        onCreated={(id) => patch({ atividadeIds: [...planilha.atividadeIds, id] })}
      />
    </div>
  );
}
