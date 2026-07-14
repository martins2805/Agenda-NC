"use client";

import { useState } from "react";
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
import { RegistroTabs } from "@/components/registros/registro-tabs";
import { ActivityForm } from "@/components/atividades/activity-form";
import { useAppData } from "@/lib/app-data-context";
import type { Registro } from "@/lib/types";

const NONE = "__none__";

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
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
  } = useAppData();
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  function patch(p: Partial<Registro>) {
    onChange({ ...registro, ...p });
  }

  const linkedAtividade = atividades.find((a) => a.id === registro.atividadeId);

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
        <ManagedSelect
          label="Assunto"
          items={lookups.assunto}
          value={registro.assuntoId}
          onChange={(id) => patch({ assuntoId: id })}
          onCreate={(name) => addLookupItem("assunto", name)}
          onRename={(id, name) => renameLookupItem("assunto", id, name)}
          onDeactivate={(id) => deactivateLookupItem("assunto", id)}
        />
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
            value={registro.atividadeId ?? NONE}
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

      <RegistroTabs tabs={registro.tabs} onChange={(tabs) => patch({ tabs })} />

      <ActivityForm
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
        editing={null}
        onCreated={(id) => patch({ atividadeId: id })}
      />
    </div>
  );
}
