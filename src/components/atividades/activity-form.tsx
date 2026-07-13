"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Link2, Table2, Plus, X } from "lucide-react";
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
import { PropostaEditor } from "@/components/proposta-editor";
import {
  useAppData,
  makeAtividadeId,
  makePropostaId,
  makeRegistroId,
  makeRegistroTabId,
  makePlanilhaId,
} from "@/lib/app-data-context";
import { PRIORIDADE_OPTIONS, STATUS_OPTIONS } from "@/lib/types";
import type { Atividade } from "@/lib/types";

const NONE = "__none__";

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
  const router = useRouter();

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

  const linkedRegistros = editing
    ? registros.filter((r) => r.atividadeId === editing.id)
    : [];
  const linkedPlanilhas = editing
    ? planilhas.filter((p) => p.atividadeId === editing.id)
    : [];
  const unlinkedRegistros = registros.filter((r) => !r.atividadeId);
  const unlinkedPlanilhas = planilhas.filter((p) => !p.atividadeId);

  function patch(p: Partial<Atividade>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function handleLinkRegistro(id: string) {
    if (!editing) return;
    updateRegistro(id, { atividadeId: editing.id });
  }

  function handleUnlinkRegistro(id: string) {
    updateRegistro(id, { atividadeId: null });
  }

  function handleCreateRegistro() {
    if (!editing) return;
    const registro = {
      id: makeRegistroId(),
      empresaId: editing.empresaId,
      unidadeId: editing.unidadeId,
      contato: editing.contato,
      assunto: editing.assunto,
      categoriaIds: [],
      tabs: [{ id: makeRegistroTabId(), titulo: "Aba 1", conteudo: "" }],
      atividadeId: editing.id,
      createdAt: new Date().toISOString(),
    };
    addRegistro(registro);
    onOpenChange(false);
    router.push(`/registros?open=${registro.id}`);
  }

  function handleLinkPlanilha(id: string) {
    if (!editing) return;
    updatePlanilha(id, { atividadeId: editing.id });
  }

  function handleUnlinkPlanilha(id: string) {
    updatePlanilha(id, { atividadeId: null });
  }

  function handleCreatePlanilha() {
    if (!editing) return;
    const planilha = {
      id: makePlanilhaId(),
      nome: "Nova planilha",
      empresaId: editing.empresaId,
      unidadeId: editing.unidadeId,
      assunto: editing.assunto,
      categoriaIds: [],
      atividadeId: editing.id,
      conteudo: null,
      createdAt: new Date().toISOString(),
    };
    addPlanilha(planilha);
    onOpenChange(false);
    router.push(`/planilhas?open=${planilha.id}`);
  }

  function handleSave() {
    let toSave = draft;
    if (showProposta && toSave.propostas.length === 0) {
      toSave = { ...toSave, propostas: [{ id: makePropostaId(), numero: 1, servicoProdutoIds: [], escopoIds: [], amostragemIds: [], quantidade: null, valorUnitario: null, valorTotal: null }] };
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
              value={draft.assunto}
              onChange={(e) => patch({ assunto: e.target.value })}
              placeholder="Descreva o assunto em poucas palavras"
            />
          </div>

          <div className="flex flex-col gap-2.5 rounded-lg border bg-muted/30 p-3">
            <Label className="flex items-center gap-1.5">
              <Link2 className="size-3.5" />
              Vínculos
            </Label>

            {!editing ? (
              <p className="text-xs text-muted-foreground">
                Crie a atividade para poder incluir ou vincular registros e planilhas.
              </p>
            ) : (
              <>
                {(linkedRegistros.length > 0 || linkedPlanilhas.length > 0) && (
                  <div className="flex flex-col gap-1.5">
                    {linkedRegistros.map((r) => (
                      <div key={r.id} className="flex items-center gap-1.5">
                        <Link
                          href={`/registros?open=${r.id}`}
                          className="flex flex-1 items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <FileText className="size-3.5 shrink-0" />
                          {r.tabs[0]?.titulo || "Registro"}
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground"
                          onClick={() => handleUnlinkRegistro(r.id)}
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
                          size="icon-xs"
                          className="text-muted-foreground"
                          onClick={() => handleUnlinkPlanilha(p.id)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    items={{
                      [NONE]: "Vincular registro existente",
                      ...Object.fromEntries(
                        unlinkedRegistros.map((r) => [r.id, r.tabs[0]?.titulo || "Registro"])
                      ),
                    }}
                    value={NONE}
                    onValueChange={(v) => v && v !== NONE && handleLinkRegistro(v)}
                  >
                    <SelectTrigger className="w-full sm:flex-1">
                      <SelectValue placeholder="Vincular registro existente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Vincular registro existente</SelectItem>
                      {unlinkedRegistros.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.tabs[0]?.titulo || "Registro"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={handleCreateRegistro}
                  >
                    <Plus className="size-4" />
                    Novo registro
                  </Button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    items={{
                      [NONE]: "Vincular planilha existente",
                      ...Object.fromEntries(
                        unlinkedPlanilhas.map((p) => [p.id, p.nome || "Planilha"])
                      ),
                    }}
                    value={NONE}
                    onValueChange={(v) => v && v !== NONE && handleLinkPlanilha(v)}
                  >
                    <SelectTrigger className="w-full sm:flex-1">
                      <SelectValue placeholder="Vincular planilha existente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Vincular planilha existente</SelectItem>
                      {unlinkedPlanilhas.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome || "Planilha"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-1.5"
                    onClick={handleCreatePlanilha}
                  >
                    <Plus className="size-4" />
                    Nova planilha
                  </Button>
                </div>
              </>
            )}
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
              type="date"
              value={draft.prazo ?? ""}
              onChange={(e) => patch({ prazo: e.target.value || null })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descrição da atividade</Label>
            <Textarea
              rows={4}
              value={draft.descricao}
              onChange={(e) => patch({ descricao: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Alinhamentos</Label>
            <Textarea
              rows={3}
              value={draft.alinhamentos}
              onChange={(e) => patch({ alinhamentos: e.target.value })}
              placeholder="Combinados e pontos alinhados com o cliente/equipe"
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
