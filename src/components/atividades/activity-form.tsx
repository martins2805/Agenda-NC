"use client";

import { useEffect, useState } from "react";
import {
  Download,
  History,
  Paperclip,
  Trash2,
} from "lucide-react";
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
import { LinkEditor } from "@/components/atividades/link-editor";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  useAppData,
  useAssuntoSuggestions,
  makeAtividadeId,
  makePropostaId,
  makeChecklistItemId,
} from "@/lib/app-data-context";
import { applyChecklistTemplate } from "@/lib/checklist-templates";
import {
  PRIORIDADE_OPTIONS,
  STATUS_OPTIONS,
  MODALIDADE_PRAZO_OPTIONS,
  MODALIDADE_PRAZO_LABELS,
  RECORRENCIA_FREQ_OPTIONS,
  RECORRENCIA_FREQ_LABELS,
  recorrenciaLabel,
} from "@/lib/types";
import { formatLocalDateTime } from "@/lib/calculations";
import type {
  Atividade,
  HistoricoEntry,
  ModalidadePrazo,
  RecorrenciaFrequencia,
} from "@/lib/types";

function findTipoByName(items: { id: string; name: string }[], name: string) {
  return items.find((i) => i.name.toLowerCase() === name.toLowerCase());
}

function emptyAtividade(): Atividade {
  return {
    id: makeAtividadeId(),
    empresaId: null,
    unidadeIds: [],
    assunto: "",
    tipoAtividadeIds: [],
    emailConteudo: "",
    oportunidadeTexto: "",
    propostas: [],
    contato: "",
    prazo: null,
    prazoFim: null,
    modalidadePrazo: "Entrega",
    recorrenciaFreq: null,
    recorrenciaCada: null,
    recorrenciaAte: null,
    descricao: "",
    alinhamentos: "",
    status: "Pendente",
    prioridade: "Médio",
    checklist: [],
    links: [],
    anexos: [],
    createdAt: new Date().toISOString(),
    concluidoEm: null,
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
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
    addAtividade,
    updateAtividade,
  } = useAppData();
  const assuntoSuggestions = useAssuntoSuggestions();

  const [draft, setDraft] = useState<Atividade>(emptyAtividade());
  const [prevOpen, setPrevOpen] = useState(open);
  const [historico, setHistorico] = useState<HistoricoEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(editing ? { ...editing } : emptyAtividade());
      setHistorico([]);
    }
  }

  useEffect(() => {
    if (!open || !editing) return;
    let cancelado = false;
    fetch(`/api/atividades/${editing.id}/historico`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelado) setHistorico(data);
      })
      .catch(() => {
        if (!cancelado) setHistorico([]);
      });
    return () => {
      cancelado = true;
    };
  }, [open, editing]);

  const tipoEmail = findTipoByName(lookups.tipoAtividade, "Email");
  const tipoOportunidade = findTipoByName(lookups.tipoAtividade, "Oportunidade");
  const tipoProposta = findTipoByName(lookups.tipoAtividade, "Proposta");

  const showEmail = !!tipoEmail && draft.tipoAtividadeIds.includes(tipoEmail.id);
  const showOportunidade =
    !!tipoOportunidade && draft.tipoAtividadeIds.includes(tipoOportunidade.id);
  const showProposta = !!tipoProposta && draft.tipoAtividadeIds.includes(tipoProposta.id);

  function patch(p: Partial<Atividade>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !editing) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/atividades/${editing.id}/anexos`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const anexo = await res.json();
          setDraft((prev) => ({ ...prev, anexos: [...prev.anexos, anexo] }));
        }
      }
    } finally {
      setUploading(false);
    }
  }

  async function removerAnexoDaAtividade(anexoId: string) {
    setDraft((prev) => ({ ...prev, anexos: prev.anexos.filter((a) => a.id !== anexoId) }));
    await fetch(`/api/anexos/${anexoId}`, { method: "DELETE" });
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
              patch(
                id === draft.empresaId
                  ? { empresaId: id }
                  : {
                      empresaId: id,
                      unidadeIds: draft.unidadeIds.filter((uid) => {
                        const u = lookups.unidade.find((item) => item.id === uid);
                        return !u?.empresaId || u.empresaId === id;
                      }),
                    }
              )
            }
            onCreate={(name) => addLookupItem("empresa", name)}
            onRename={(id, name) => renameLookupItem("empresa", id, name)}
            onDeactivate={(id) => deactivateLookupItem("empresa", id)}
          />

          <ManagedMultiSelect
            label="Unidade"
            items={lookups.unidade.filter(
              (u) => !u.empresaId || u.empresaId === draft.empresaId
            )}
            value={draft.unidadeIds}
            onChange={(ids) => patch({ unidadeIds: ids })}
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

          {/* PROMPT 3 (4.1): modalidade explícita de prazo. Antes, a janela de
              execução só aparecia quando o tipo de atividade se chamava
              "Agendamento" — agora é uma escolha do usuário, independente do
              tipo. Continua sem campo obrigatório (D4). */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Tipo de prazo</Label>
              <Select
                value={draft.modalidadePrazo}
                onValueChange={(v) => patch({ modalidadePrazo: v as ModalidadePrazo })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar tipo de prazo" />
                </SelectTrigger>
                <SelectContent>
                  {MODALIDADE_PRAZO_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODALIDADE_PRAZO_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {draft.modalidadePrazo === "Janela" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Início da janela</Label>
                  <Input
                    type="datetime-local"
                    value={draft.prazo ?? ""}
                    onChange={(e) =>
                      patch({
                        prazo: e.target.value || null,
                        prazoFim: e.target.value ? draft.prazoFim : null,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Fim da janela</Label>
                  <Input
                    type="datetime-local"
                    min={draft.prazo ?? undefined}
                    value={draft.prazoFim ?? ""}
                    disabled={!draft.prazo}
                    onChange={(e) => patch({ prazoFim: e.target.value || null })}
                  />
                </div>
              </div>
            ) : draft.modalidadePrazo === "Recorrente" ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Primeira ocorrência</Label>
                    <Input
                      type="datetime-local"
                      value={draft.prazo ?? ""}
                      onChange={(e) => patch({ prazo: e.target.value || null })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Repetir até (opcional)</Label>
                    <Input
                      type="datetime-local"
                      min={draft.prazo ?? undefined}
                      value={draft.recorrenciaAte ?? ""}
                      onChange={(e) => patch({ recorrenciaAte: e.target.value || null })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>A cada</Label>
                    <Input
                      type="number"
                      min={1}
                      value={draft.recorrenciaCada ?? 1}
                      onChange={(e) =>
                        patch({ recorrenciaCada: Math.max(Number(e.target.value) || 1, 1) })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Periodicidade</Label>
                    <Select
                      value={draft.recorrenciaFreq ?? ""}
                      onValueChange={(v) =>
                        patch({ recorrenciaFreq: v as RecorrenciaFrequencia })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar periodicidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECORRENCIA_FREQ_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {
                              RECORRENCIA_FREQ_LABELS[f][
                                (draft.recorrenciaCada ?? 1) === 1 ? "singular" : "plural"
                              ]
                            }
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {draft.recorrenciaFreq && (
                  <p className="text-xs text-muted-foreground">
                    {recorrenciaLabel(draft.recorrenciaFreq, draft.recorrenciaCada)}
                    {draft.recorrenciaAte
                      ? `, até ${formatLocalDateTime(draft.recorrenciaAte)}`
                      : ", sem data de término (ocorrências geradas por 2 anos)"}
                    .
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label>Prazo</Label>
                <Input
                  type="datetime-local"
                  value={draft.prazo ?? ""}
                  onChange={(e) => patch({ prazo: e.target.value || null })}
                />
              </div>
            )}
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

          <LinkEditor items={draft.links} onChange={(links) => patch({ links })} />

          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <Paperclip className="size-3.5" />
              Anexos
            </Label>
            {editing ? (
              <>
                {draft.anexos.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {draft.anexos.map((anexo) => (
                      <div key={anexo.id} className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm">
                        <a
                          href={`/api/anexos/${anexo.id}`}
                          className="flex flex-1 items-center gap-1.5 text-primary hover:underline"
                        >
                          <Download className="size-3.5 shrink-0" />
                          {anexo.nomeOriginal}
                          <span className="text-xs text-muted-foreground">
                            ({Math.max(1, Math.round(anexo.tamanho / 1024))} KB)
                          </span>
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0 text-destructive"
                          title="Remover anexo"
                          onClick={() => removerAnexoDaAtividade(anexo.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Input
                  type="file"
                  multiple
                  disabled={uploading}
                  onChange={(e) => {
                    handleUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Salve a atividade para anexar arquivos.
              </p>
            )}
          </div>

          {editing && (
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5">
                <History className="size-3.5" />
                Histórico
              </Label>
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {historico.map((h) => {
                    const formatar = (v: string | null) =>
                      v === null ? "—" : h.campo === "prazo" ? new Date(v).toLocaleString("pt-BR") : v;
                    return (
                      <div key={h.id} className="text-sm">
                        <span className="text-muted-foreground">
                          {new Date(h.createdAt).toLocaleString("pt-BR")} ·{" "}
                        </span>
                        <span className="font-medium capitalize">{h.campo}</span>
                        {": "}
                        {formatar(h.valorAnterior)} → {formatar(h.valorNovo)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
