"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Link2, Plus, Table2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManagedSelect } from "@/components/managed-select";
import { ManagedMultiSelect } from "@/components/managed-multi-select";
import { ChecklistEditor } from "@/components/checklist-editor";
import { ChecklistTemplateManager } from "@/components/checklist-template-manager";
import { PropostaEditor } from "@/components/proposta-editor";
import { RichTextEditor } from "@/components/registros/rich-text-editor";
import {
  useAppData,
  useAssuntoSuggestions,
  makeAtividadeId,
  makePropostaId,
  makeRegistroId,
  makeRegistroTabId,
  makePlanilhaId,
  makeChecklistItemId,
} from "@/lib/app-data-context";
import { applyChecklistTemplate } from "@/lib/checklist-templates";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Atividade } from "@/lib/types";

function findTipoByName(items: { id: string; name: string }[], name: string) {
  return items.find((i) => i.name.toLowerCase() === name.toLowerCase());
}

function emptyAtividade(): Atividade {
  return {
    id: makeAtividadeId(),
    empresaId: null,
    unidadeId: null,
    assunto: "",
    tipoAtividadeIds: [],
    emailConteudo: "",
    oportunidadeTexto: "",
    propostas: [],
    contato: "",
    prazo: null,
    descricao: "",
    alinhamentos: "",
    status: "Pendente",
    prioridade: "Médio",
    checklist: [],
    createdAt: new Date().toISOString(),
  };
}

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Atividade | null;
  onCreated?: (id: string) => void;
}

export function ActivityForm({ open, onOpenChange, editing, onCreated }: ActivityFormProps) {
  const {
    lookups,
    registros,
    planilhas,
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
    addAtividade,
    updateAtividade,
    addRegistro,
    updateRegistro,
    addPlanilha,
    updatePlanilha,
  } = useAppData();
  const assuntoSuggestions = useAssuntoSuggestions();

  const [draft, setDraft] = useState<Atividade>(emptyAtividade());
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(editing ? { ...editing } : emptyAtividade());
    }
  }

  const tipoEmail = findTipoByName(lookups.tipoAtividade, "Email");
  const tipoOportunidade = findTipoByName(lookups.tipoAtividade, "Oportunidade");
  const tipoProposta = findTipoByName(lookups.tipoAtividade, "Proposta");

  const showEmail = !!tipoEmail && draft.tipoAtividadeIds.includes(tipoEmail.id);
  const showOportunidade =
    !!tipoOportunidade && draft.tipoAtividadeIds.includes(tipoOportunidade.id);
  const showProposta = !!tipoProposta && draft.tipoAtividadeIds.includes(tipoProposta.id);

  const linkedRegistros = registros.filter((r) => r.atividadeId === draft.id);
  const linkedPlanilhas = planilhas.filter((p) => p.atividadeId === draft.id);
  const unlinkedRegistros = registros.filter((r) => !r.atividadeId && !r.deletedAt);
  const unlinkedPlanilhas = planilhas.filter((p) => !p.atividadeId && !p.deletedAt);

  function patch(p: Partial<Atividade>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function createRegistroVinculado() {
    addRegistro({
      id: makeRegistroId(),
      nome: "",
      empresaId: draft.empresaId,
      unidadeId: draft.unidadeId,
      contato: "",
      assunto: draft.assunto,
      categoriaIds: [],
      tabs: [{ id: makeRegistroTabId(), titulo: "Principal", conteudo: "" }],
      atividadeId: draft.id,
      createdAt: new Date().toISOString(),
    });
  }

  function createPlanilhaVinculada() {
    addPlanilha({
      id: makePlanilhaId(),
      nome: "",
      empresaId: draft.empresaId,
      unidadeId: draft.unidadeId,
      assunto: draft.assunto,
      categoriaIds: [],
      atividadeId: draft.id,
      conteudo: null,
      createdAt: new Date().toISOString(),
    });
  }

  function handleSave() {
    let toSave = draft;
    if (showProposta && toSave.propostas.length === 0) {
      toSave = { ...toSave, propostas: [{ id: makePropostaId(), numero: 1, servicoProdutoIds: [], escopoIds: [], amostragemIds: [], quantidade: null, valorUnitario: null, valorTotal: null, tipo: null, detalhe: "", observacao: "", prazoInicio: null, prazoFim: null, statusNegociacao: null }] };
    }
    if (editing) {
      updateAtividade(editing.id, toSave);
    } else {
      addAtividade(toSave);
      onCreated?.(toSave.id);
    }
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:inset-0 data-[side=right]:h-full data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:sm:max-w-none">
        <SheetHeader>
          <SheetTitle>{editing ? "Editar atividade" : "Nova atividade"}</SheetTitle>
          <SheetDescription>
            Preencha os campos abaixo. Tudo já fica registrado nesta sessão.
          </SheetDescription>
        </SheetHeader>

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-4">
          <ManagedSelect
            label="Empresa"
            items={lookups.empresa}
            value={draft.empresaId}
            onChange={(id) =>
              patch(id === draft.empresaId ? { empresaId: id } : { empresaId: id, unidadeId: null })
            }
            onCreate={(name) => addLookupItem("empresa", name)}
            onRename={(id, name) => renameLookupItem("empresa", id, name)}
            onDeactivate={(id) => deactivateLookupItem("empresa", id)}
          />

          <ManagedSelect
            label="Unidade"
            items={lookups.unidade.filter(
              (u) => !u.empresaId || u.empresaId === draft.empresaId
            )}
            value={draft.unidadeId}
            onChange={(id) => patch({ unidadeId: id })}
            onCreate={(name) => addLookupItem("unidade", name, draft.empresaId)}
            onRename={(id, name) => renameLookupItem("unidade", id, name)}
            onDeactivate={(id) => deactivateLookupItem("unidade", id)}
          />

          <ManagedMultiSelect
            label="Tipo de atividade"
            items={lookups.tipoAtividade}
            value={draft.tipoAtividadeIds}
            onChange={(ids) => patch({ tipoAtividadeIds: ids })}
            onCreate={(name) => addLookupItem("tipoAtividade", name)}
            onRename={(id, name) => renameLookupItem("tipoAtividade", id, name)}
            onDeactivate={(id) => deactivateLookupItem("tipoAtividade", id)}
          />

          <div className="flex flex-col gap-1.5">
            <Label>Assunto</Label>
            <Input
              list="assunto-sugestoes-atividade"
              value={draft.assunto}
              onChange={(e) => patch({ assunto: e.target.value })}
              placeholder="Descreva o assunto em poucas palavras"
            />
            <datalist id="assunto-sugestoes-atividade">
              {assuntoSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
            <Label className="flex items-center gap-1.5">
              <Link2 className="size-3.5" />
              Vínculos
            </Label>

            {(linkedRegistros.length > 0 || linkedPlanilhas.length > 0) && (
              <div className="flex flex-col gap-1.5">
                {linkedRegistros.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5">
                    <Link
                      href={`/registros?open=${r.id}`}
                      className="flex flex-1 items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="size-3.5 shrink-0" />
                      {r.nome || r.tabs[0]?.titulo || "Registro"}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground"
                      title="Desvincular"
                      onClick={() => updateRegistro(r.id, { atividadeId: null })}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {linkedPlanilhas.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <Link
                      href={`/planilhas?open=${p.id}`}
                      className="flex flex-1 items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Table2 className="size-3.5 shrink-0" />
                      {p.nome || "Planilha"}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground"
                      title="Desvincular"
                      onClick={() => updatePlanilha(p.id, { atividadeId: null })}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex gap-1.5">
                <Select
                  value=""
                  onValueChange={(id) => id && updateRegistro(id, { atividadeId: draft.id })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vincular registro existente" />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedRegistros.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome || r.tabs[0]?.titulo || "Registro sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" className="shrink-0" title="Criar novo registro vinculado" onClick={createRegistroVinculado}>
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Select
                  value=""
                  onValueChange={(id) => id && updatePlanilha(id, { atividadeId: draft.id })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vincular planilha existente" />
                  </SelectTrigger>
                  <SelectContent>
                    {unlinkedPlanilhas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome || "Planilha sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" className="shrink-0" title="Criar nova planilha vinculada" onClick={createPlanilhaVinculada}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {showEmail && (
            <div className="flex flex-col gap-1.5">
              <Label>Conteúdo do e-mail</Label>
              <Textarea
                rows={4}
                value={draft.emailConteudo}
                onChange={(e) => patch({ emailConteudo: e.target.value })}
              />
            </div>
          )}

          {showOportunidade && (
            <div className="flex flex-col gap-1.5">
              <Label>Oportunidade</Label>
              <Input
                value={draft.oportunidadeTexto}
                onChange={(e) => patch({ oportunidadeTexto: e.target.value })}
                placeholder="Descreva em poucas palavras"
              />
            </div>
          )}

          {showProposta && (
            <PropostaEditor
              propostas={
                draft.propostas.length > 0
                  ? draft.propostas
                  : [
                      {
                        id: makePropostaId(),
                        numero: 1,
                        servicoProdutoIds: [],
                        escopoIds: [],
                        amostragemIds: [],
                        quantidade: null,
                        valorUnitario: null,
                        valorTotal: null,
                        tipo: null,
                        detalhe: "",
                        observacao: "",
                        prazoInicio: null,
                        prazoFim: null,
                        statusNegociacao: null,
                      },
                    ]
              }
              onChange={(propostas) => patch({ propostas })}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Contato</Label>
            <Input
              value={draft.contato}
              onChange={(e) => patch({ contato: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Prazo</Label>
            <Input
              type="datetime-local"
              value={draft.prazo ?? ""}
              onChange={(e) => patch({ prazo: e.target.value || null })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descrição da atividade</Label>
            <RichTextEditor
              content={draft.descricao}
              onChange={(html) => patch({ descricao: html })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Alinhamentos</Label>
            <RichTextEditor
              content={draft.alinhamentos}
              onChange={(html) => patch({ alinhamentos: html })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status de conclusão</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => patch({ status: v as Atividade["status"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Prioridade</Label>
            <Select
              value={draft.prioridade}
              onValueChange={(v) => patch({ prioridade: v as Atividade["prioridade"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar prioridade" />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADE_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ChecklistEditor
            items={draft.checklist}
            onChange={(checklist) => patch({ checklist })}
            headerActions={
              <ChecklistTemplateManager
                currentItems={draft.checklist}
                onApply={(template) =>
                  patch({
                    checklist: [
                      ...draft.checklist,
                      ...applyChecklistTemplate(template, (texto, parentId) => ({
                        id: makeChecklistItemId(),
                        texto,
                        concluido: false,
                        prazo: null,
                        parentId,
                      })),
                    ],
                  })
                }
              />
            }
          />
        </div>

        <SheetFooter className="border-t">
          <Button onClick={handleSave}>
            {editing ? "Salvar alterações" : "Criar atividade"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
