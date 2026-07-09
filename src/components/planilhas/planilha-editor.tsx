"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManagedSelect } from "@/components/managed-select";
import { ManagedMultiSelect } from "@/components/managed-multi-select";
import { ActivityForm } from "@/components/atividades/activity-form";
import { useAppData } from "@/lib/app-data-context";
import type { Planilha } from "@/lib/types";

const UniverSheet = dynamic(
  () => import("@/components/planilhas/univer-sheet").then((m) => m.UniverSheet),
  { ssr: false }
);

const NONE = "__none__";

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

  function patch(p: Partial<Planilha>) {
    onChange({ ...planilha, ...p });
  }

  const linkedAtividade = atividades.find((a) => a.id === planilha.atividadeId);

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
          onChange={(id) => patch({ empresaId: id })}
          onCreate={(name) => addLookupItem("empresa", name)}
          onRename={(id, name) => renameLookupItem("empresa", id, name)}
          onDeactivate={(id) => deactivateLookupItem("empresa", id)}
        />
        <ManagedSelect
          label="Unidade"
          items={lookups.unidade}
          value={planilha.unidadeId}
          onChange={(id) => patch({ unidadeId: id })}
          onCreate={(name) => addLookupItem("unidade", name)}
          onRename={(id, name) => renameLookupItem("unidade", id, name)}
          onDeactivate={(id) => deactivateLookupItem("unidade", id)}
        />
        <ManagedSelect
          label="Assunto"
          items={lookups.assunto}
          value={planilha.assuntoId}
          onChange={(id) => patch({ assuntoId: id })}
          onCreate={(name) => addLookupItem("assunto", name)}
          onRename={(id, name) => renameLookupItem("assunto", id, name)}
          onDeactivate={(id) => deactivateLookupItem("assunto", id)}
        />
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
          <Select
            items={{
              [NONE]: "Nenhuma",
              ...Object.fromEntries(
                atividades.map((a) => {
                  const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
                  const assunto = lookups.assunto.find((s) => s.id === a.assuntoId);
                  const label =
                    [empresa?.name, assunto?.name].filter(Boolean).join(" · ") ||
                    "Atividade sem empresa/assunto";
                  return [a.id, label];
                })
              ),
            }}
            value={planilha.atividadeId ?? NONE}
            onValueChange={(v) => patch({ atividadeId: v === NONE ? null : v })}
          >
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Nenhuma atividade vinculada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhuma</SelectItem>
              {atividades.map((a) => {
                const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
                const assunto = lookups.assunto.find((s) => s.id === a.assuntoId);
                return (
                  <SelectItem key={a.id} value={a.id}>
                    {[empresa?.name, assunto?.name].filter(Boolean).join(" · ") ||
                      "Atividade sem empresa/assunto"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
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
        {linkedAtividade && (
          <p className="text-xs text-muted-foreground">
            Vinculado a atividade com status &ldquo;{linkedAtividade.status}&rdquo;.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Planilha</Label>
        <UniverSheet workbookId={planilha.id} workbookName={planilha.nome || "Planilha"} />
      </div>

      <ActivityForm
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        editing={null}
        onCreated={(id) => patch({ atividadeId: id })}
      />
    </div>
  );
}
