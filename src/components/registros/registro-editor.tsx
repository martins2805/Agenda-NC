"use client";

import { useState } from "react";
import { ArrowLeft, ClipboardList, Link2, Plus, Table2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManagedSelect } from "@/components/managed-select";
import { ManagedMultiSelect } from "@/components/managed-multi-select";
import { FilterMultiSelect } from "@/components/filter-multi-select";
import { RegistroTabs } from "@/components/registros/registro-tabs";
import { ActivityForm } from "@/components/atividades/activity-form";
import { useAppData, useAssuntoSuggestions } from "@/lib/app-data-context";
import type { Registro } from "@/lib/types";

interface RegistroEditorProps {
  registro: Registro;
  onChange: (registro: Registro) => void;
  onBack: () => void;
  onDelete: () => void;
}

export function RegistroEditor({
  registro,
  onChange,
  onBack,
  onDelete,
}: RegistroEditorProps) {
  const {
    lookups,
    atividades,
    atividadesGerais,
    planilhas,
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
  } = useAppData();
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const assuntoSuggestions = useAssuntoSuggestions();

  function patch(p: Partial<Registro>) {
    onChange({ ...registro, ...p });
  }

  const linkedAtividades = atividades.filter((a) => registro.atividadeIds.includes(a.id));

  function atividadeLabel(a: (typeof atividades)[number]) {
    const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
    return [empresa?.name, a.assunto].filter(Boolean).join(" · ") || "Atividade sem empresa/assunto";
  }

  function execucaoLabel(g: (typeof atividadesGerais)[number]) {
    const empresa = lookups.empresa.find((e) => e.id === g.empresaId);
    return [empresa?.name, g.assunto].filter(Boolean).join(" · ") || "Execução sem empresa/assunto";
  }

  function planilhaLabel(p: (typeof planilhas)[number]) {
    return p.nome || "Planilha sem nome";
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
          Excluir registro
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Nome</Label>
          <Input
            value={registro.nome}
            onChange={(e) => patch({ nome: e.target.value })}
            placeholder="Ex: Reuniao de alinhamento"
          />
        </div>
        <ManagedSelect
          label="Empresa"
          items={lookups.empresa}
          value={registro.empresaId}
          onChange={(id) =>
            patch(
              id === registro.empresaId
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
            (u) => !u.empresaId || u.empresaId === registro.empresaId
          )}
          value={registro.unidadeId}
          onChange={(id) => patch({ unidadeId: id })}
          onCreate={(name) => addLookupItem("unidade", name, registro.empresaId)}
          onRename={(id, name) => renameLookupItem("unidade", id, name)}
          onDeactivate={(id) => deactivateLookupItem("unidade", id)}
        />
        <div className="flex flex-col gap-1.5">
          <Label>Contato</Label>
          <Input
            value={registro.contato}
            onChange={(e) => patch({ contato: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Assunto</Label>
          <Input
            list="assunto-sugestoes-registro"
            value={registro.assunto}
            onChange={(e) => patch({ assunto: e.target.value })}
            placeholder="Descreva o assunto em poucas palavras"
          />
          <datalist id="assunto-sugestoes-registro">
            {assuntoSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Prazo (opcional)</Label>
          <Input
            type="date"
            value={registro.prazo ?? ""}
            onChange={(e) => patch({ prazo: e.target.value || null })}
          />
        </div>
      </div>

      <ManagedMultiSelect
        label="Tipo / categoria"
        items={lookups.categoriaRegistro}
        value={registro.categoriaIds}
        onChange={(ids) => patch({ categoriaIds: ids })}
        onCreate={(name) => addLookupItem("categoriaRegistro", name)}
        onRename={(id, name) => renameLookupItem("categoriaRegistro", id, name)}
        onDeactivate={(id) => deactivateLookupItem("categoriaRegistro", id)}
      />

      <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
        <Label className="flex items-center gap-1.5">
          <Link2 className="size-3.5" />
          Atividade vinculada
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-full sm:flex-1">
            <FilterMultiSelect
              placeholder="Nenhuma atividade vinculada"
              options={atividades.map((a) => ({ value: a.id, label: atividadeLabel(a) }))}
              value={registro.atividadeIds}
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

      <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
        <Label className="flex items-center gap-1.5">
          <ClipboardList className="size-3.5" />
          Execução vinculada
        </Label>
        <FilterMultiSelect
          placeholder="Nenhuma execução vinculada"
          options={atividadesGerais.map((g) => ({ value: g.id, label: execucaoLabel(g) }))}
          value={registro.atividadeGeralIds}
          onChange={(ids) => patch({ atividadeGeralIds: ids })}
        />
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
        <Label className="flex items-center gap-1.5">
          <Table2 className="size-3.5" />
          Planilha vinculada
        </Label>
        <FilterMultiSelect
          placeholder="Nenhuma planilha vinculada"
          options={planilhas.filter((p) => !p.deletedAt).map((p) => ({ value: p.id, label: planilhaLabel(p) }))}
          value={registro.planilhaIds}
          onChange={(ids) => patch({ planilhaIds: ids })}
        />
      </div>

      <RegistroTabs tabs={registro.tabs} onChange={(tabs) => patch({ tabs })} />

      <ActivityForm
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        editing={null}
        onCreated={(id) => patch({ atividadeIds: [...registro.atividadeIds, id] })}
      />
    </div>
  );
}
