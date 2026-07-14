"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Link2, Table2 } from "lucide-react";
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
import { useAppData, makeAtividadeId, makePropostaId } from "@/lib/app-data-context";
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
    assuntoId: null,
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
  } = useAppData();

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

  function patch(p: Partial<Atividade>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  function handleSave() {
    let toSave = draft;
    if (showProposta && toSave.propostas.length === 0) {
      toSave = { ...toSave, propostas: [{ id: makePropostaId(), numero: 1, servicoProdutoIds: [], escopoIds: [], amostragemIds: [], quantidade: null, valorUnitario: null, valorTotal: null, prazoInicio: null, prazoFim: null }] };
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

          <ManagedSelect
            label="Assunto"
            items={lookups.assunto}
            value={draft.assuntoId}
            onChange={(id) => patch({ assuntoId: id })}
            onCreate={(name) => addLookupItem("assunto", name)}
            onRename={(id, name) => renameLookupItem("assunto", id, name)}
            onDeactivate={(id) => deactivateLookupItem("assunto", id)}
          />

          {(linkedRegistros.length > 0 || linkedPlanilhas.length > 0) && (
            <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
              <Label className="flex items-center gap-1.5">
                <Link2 className="size-3.5" />
                Vínculos
              </Label>
              <div className="flex flex-col gap-1.5">
                {linkedRegistros.map((r) => (
                  <Link
                    key={r.id}
                    href={`/registros?open=${r.id}`}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <FileText className="size-3.5 shrink-0" />
                    {r.nome || r.tabs[0]?.titulo || "Registro"}
                  </Link>
                ))}
                {linkedPlanilhas.map((p) => (
                  <Link
                    key={p.id}
                    href={`/planilhas?open=${p.id}`}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Table2 className="size-3.5 shrink-0" />
                    {p.nome || "Planilha"}
                  </Link>
                ))}
              </div>
            </div>
          )}

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
                        prazoInicio: null,
                        prazoFim: null,
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
