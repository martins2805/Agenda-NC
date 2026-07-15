"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  Check,
  ClipboardCheck,
} from "lucide-react";
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
import { ChecklistTemplateManager } from "@/components/checklist-template-manager";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import { ExecucaoFilterBar } from "@/components/atividades/execucao-filter-bar";
import {
  makeAtividadeGeralId,
  makeChecklistGeralItemId,
  useAppData,
} from "@/lib/app-data-context";
import { applyChecklistTemplate } from "@/lib/checklist-templates";
import { PRIORIDADE_OPTIONS, STATUS_GERAL_OPTIONS } from "@/lib/types";
import type { AtividadeGeral, ChecklistGeralItem } from "@/lib/types";
import { parseLocalDate } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { PRIORIDADE_STYLES, STATUS_GERAL_STYLES, prazoStatusFor, PRAZO_STYLES } from "@/lib/status-colors";
import {
  DEFAULT_EXECUCAO_FILTERS,
  execucaoFiltersFromParams,
  matchesExecucao,
  sortExecucoes,
  type ExecucaoFilters,
} from "@/lib/execucao-filters";

function emptyChecklistItem(parentId: string | null = null): ChecklistGeralItem {
  return {
    id: makeChecklistGeralItemId(),
    parentId,
    texto: "",
    status: "Pendente",
    prioridade: "Médio",
    prazo: null,
    empresaId: null,
    unidadeId: null,
  };
}

function emptyAtividadeGeral(): AtividadeGeral {
  return {
    id: makeAtividadeGeralId(),
    empresaId: null,
    unidadeId: null,
    tipoIds: [],
    assunto: "",
    vinculos: "",
    prazo: null,
    descricao: "",
    status: "Pendente",
    prioridade: "Médio",
    setorIds: [],
    checklist: [],
    createdAt: new Date().toISOString(),
  };
}

function completion(checklist: ChecklistGeralItem[]) {
  if (checklist.length === 0) return 0;
  return Math.round(
    (checklist.filter((item) => item.status === "Concluído").length / checklist.length) * 100
  );
}

function childrenOf(items: ChecklistGeralItem[], parentId: string | null) {
  return items.filter((i) => (i.parentId ?? null) === parentId);
}

// --- Editor de checklist (elemento principal da execução) ------------------
// Itens compactos por padrão; expandem sob demanda para exibir empresa,
// unidade, prioridade e prazo. Mantém arrastar-e-soltar e subitens ilimitados.
function ChecklistGeralEditor({
  items,
  onChange,
}: {
  items: ChecklistGeralItem[];
  onChange: (items: ChecklistGeralItem[]) => void;
}) {
  const { lookups, addLookupItem, renameLookupItem, deactivateLookupItem } = useAppData();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function update(id: string, patch: Partial<ChecklistGeralItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function cycleStatus(item: ChecklistGeralItem) {
    const next: ChecklistGeralItem["status"] =
      item.status === "Concluído" ? "Pendente" : "Concluído";
    update(item.id, { status: next });
  }

  function addItem(parentId: string | null = null, empresaId: string | null = null) {
    const item = { ...emptyChecklistItem(parentId), empresaId };
    onChange([...items, item]);
    setExpanded((prev) => new Set(prev).add(item.id));
  }

  function removeItem(id: string) {
    const toRemove = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const item of items) {
        if (item.parentId && toRemove.has(item.parentId) && !toRemove.has(item.id)) {
          toRemove.add(item.id);
          grew = true;
        }
      }
    }
    onChange(items.filter((i) => !toRemove.has(i.id)));
  }

  function moveDragged(overId: string) {
    if (!draggingId || draggingId === overId) return;
    const dragged = items.find((i) => i.id === draggingId);
    const over = items.find((i) => i.id === overId);
    if (!dragged || !over) return;
    if ((dragged.parentId ?? null) !== (over.parentId ?? null)) return;
    const from = items.findIndex((i) => i.id === draggingId);
    const to = items.findIndex((i) => i.id === overId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function renderItem(item: ChecklistGeralItem, depth: number) {
    const kids = childrenOf(items, item.id);
    const isOpen = expanded.has(item.id);
    const concluido = item.status === "Concluído";
    const prazoStatus = item.prazo ? prazoStatusFor(item.prazo) : null;
    return (
      <div key={item.id} className="flex flex-col gap-2">
        <div
          draggable
          onDragStart={() => setDraggingId(item.id)}
          onDragOver={(e) => {
            e.preventDefault();
            moveDragged(item.id);
          }}
          onDragEnd={() => setDraggingId(null)}
          className={cn(
            "rounded-xl border bg-card p-2 transition-shadow",
            draggingId === item.id && "shadow-md"
          )}
          style={{ marginLeft: depth * 20 }}
        >
          {/* Linha compacta */}
          <div className="flex items-center gap-2">
            <span className="cursor-grab text-muted-foreground active:cursor-grabbing" title="Arrastar para reorganizar">
              <GripVertical className="size-4" />
            </span>
            <button
              type="button"
              onClick={() => cycleStatus(item)}
              title={concluido ? "Reabrir" : "Concluir"}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                concluido
                  ? "border-transparent bg-[var(--status-concluido)] text-white"
                  : "border-muted-foreground/40 text-transparent hover:border-[var(--status-concluido)]"
              )}
            >
              <Check className="size-3.5" />
            </button>
            <Input
              value={item.texto}
              onChange={(e) => update(item.id, { texto: e.target.value })}
              placeholder={item.parentId ? "Subitem" : "Item"}
              className={cn("h-8 flex-1", concluido && "text-muted-foreground line-through")}
            />
            <span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-block", STATUS_GERAL_STYLES[item.status])}>
              {item.status}
            </span>
            {prazoStatus && (
              <span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-medium md:inline-block", PRAZO_STYLES[prazoStatus])}>
                {parseLocalDate(item.prazo!).toLocaleDateString("pt-BR")}
              </span>
            )}
            <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => toggleExpand(item.id)}>
              {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0 text-destructive" onClick={() => removeItem(item.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>

          {/* Detalhes expandidos */}
          {isOpen && (
            <div className="mt-2 flex flex-col gap-2 border-t pt-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <ManagedSelect
                  label=""
                  items={lookups.empresa}
                  value={item.empresaId}
                  onChange={(id) => update(item.id, { empresaId: id, unidadeId: null })}
                  onCreate={(name) => addLookupItem("empresa", name)}
                  onRename={(id, name) => renameLookupItem("empresa", id, name)}
                  onDeactivate={(id) => deactivateLookupItem("empresa", id)}
                  placeholder="Empresa"
                />
                <ManagedSelect
                  label=""
                  items={lookups.unidade.filter((u) => !u.empresaId || u.empresaId === item.empresaId)}
                  value={item.unidadeId}
                  onChange={(id) => update(item.id, { unidadeId: id })}
                  onCreate={(name) => addLookupItem("unidade", name, item.empresaId)}
                  onRename={(id, name) => renameLookupItem("unidade", id, name)}
                  onDeactivate={(id) => deactivateLookupItem("unidade", id)}
                  placeholder="Unidade"
                />
                <Select value={item.status} onValueChange={(v) => update(item.id, { status: v as ChecklistGeralItem["status"] })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_GERAL_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={item.prioridade} onValueChange={(v) => update(item.id, { prioridade: v as ChecklistGeralItem["prioridade"] })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                  <SelectContent>
                    {PRIORIDADE_OPTIONS.map((prioridade) => (
                      <SelectItem key={prioridade} value={prioridade}>{prioridade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={item.prazo ?? ""}
                  onChange={(e) => update(item.id, { prazo: e.target.value || null })}
                  className="w-fit"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addItem(item.id, item.empresaId)}>
                  <Plus className="size-3.5" />
                  Subitem
                </Button>
              </div>
            </div>
          )}
        </div>
        {kids.map((child) => renderItem(child, depth + 1))}
      </div>
    );
  }

  const roots = childrenOf(items, null);
  const groups = useMemo(() => {
    const map = new Map<string | null, ChecklistGeralItem[]>();
    for (const item of roots) {
      const key = item.empresaId ?? null;
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div className="flex min-h-[60vh] flex-col gap-3 rounded-2xl border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-base font-semibold">Checklist da execução</Label>
        <div className="flex flex-wrap gap-2">
          <ChecklistTemplateManager
            currentItems={items}
            onApply={(template) =>
              onChange([
                ...items,
                ...applyChecklistTemplate(template, (texto, parentId) => ({
                  ...emptyChecklistItem(parentId),
                  texto,
                })),
              ])
            }
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => addItem(null)}>
            <Plus className="size-4" />
            Item
          </Button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <ClipboardCheck className="size-8" />
          <p className="text-sm">Adicione itens ao checklist para começar a execução.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(groups.entries()).map(([empresaId, groupItems]) => {
            const empresa = lookups.empresa.find((e) => e.id === empresaId);
            return (
              <div key={empresaId ?? "sem-empresa"} className="flex flex-col gap-2">
                <span className="ledger-label">{empresa?.name ?? "Sem empresa"}</span>
                {groupItems.map((item) => renderItem(item, 0))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function initialFilters(): ExecucaoFilters {
  if (typeof window === "undefined") return DEFAULT_EXECUCAO_FILTERS;
  return execucaoFiltersFromParams(new URLSearchParams(window.location.search));
}

export default function ExecucoesPage() {
  const {
    lookups,
    atividadesGerais,
    addLookupItem,
    renameLookupItem,
    deactivateLookupItem,
    addAtividadeGeral,
    updateAtividadeGeral,
    deleteAtividadeGeral,
  } = useAppData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<AtividadeGeral | null>(null);
  const [view, setView] = useState<ViewMode>("cards");
  const [filters, setFilters] = useState<ExecucaoFilters>(initialFilters);
  const [infoOpen, setInfoOpen] = useState(true);

  const editing = draftNew ?? atividadesGerais.find((a) => a.id === editingId) ?? null;

  const filtered = useMemo(() => {
    const list = atividadesGerais.filter((a) => matchesExecucao(a, filters, lookups));
    return sortExecucoes(list, filters.ordenar);
  }, [atividadesGerais, filters, lookups]);

  function save(atividade: AtividadeGeral) {
    if (draftNew && draftNew.id === atividade.id) {
      addAtividadeGeral(atividade);
      setDraftNew(null);
    } else {
      updateAtividadeGeral(atividade.id, atividade);
    }
  }

  // --- Tela da execução (checklist dominante) ---
  if (editing) {
    const patch = (p: Partial<AtividadeGeral>) => save({ ...editing, ...p });
    const pct = completion(editing.checklist);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditingId(null);
              setDraftNew(null);
              setInfoOpen(true);
            }}
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Checklist {pct}%</span>
            {!draftNew && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive"
                onClick={() => {
                  deleteAtividadeGeral(editing.id);
                  setEditingId(null);
                }}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            )}
          </div>
        </div>

        {/* Informações gerais (compactas, recolhíveis) */}
        <div className="panel-card p-3 sm:p-4">
          <button
            type="button"
            onClick={() => setInfoOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex flex-col">
              <span className="font-semibold">{editing.assunto || "Nova execução"}</span>
              <span className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS_GERAL_STYLES[editing.status])}>{editing.status}</span>
                <span className={cn("rounded-full px-2 py-0.5 font-medium", PRIORIDADE_STYLES[editing.prioridade])}>{editing.prioridade}</span>
              </span>
            </span>
            {infoOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>

          {infoOpen && (
            <div className="mt-3 flex flex-col gap-4 border-t pt-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ManagedSelect
                  label="Empresa"
                  items={lookups.empresa}
                  value={editing.empresaId}
                  onChange={(id) => patch(id === editing.empresaId ? { empresaId: id } : { empresaId: id, unidadeId: null })}
                  onCreate={(name) => addLookupItem("empresa", name)}
                  onRename={(id, name) => renameLookupItem("empresa", id, name)}
                  onDeactivate={(id) => deactivateLookupItem("empresa", id)}
                />
                <ManagedSelect
                  label="Unidade"
                  items={lookups.unidade.filter((u) => !u.empresaId || u.empresaId === editing.empresaId)}
                  value={editing.unidadeId}
                  onChange={(id) => patch({ unidadeId: id })}
                  onCreate={(name) => addLookupItem("unidade", name, editing.empresaId)}
                  onRename={(id, name) => renameLookupItem("unidade", id, name)}
                  onDeactivate={(id) => deactivateLookupItem("unidade", id)}
                />
                <ManagedMultiSelect
                  label="Tipo"
                  items={lookups.tipoAtividadeGeral}
                  value={editing.tipoIds}
                  onChange={(tipoIds) => patch({ tipoIds })}
                  onCreate={(name) => addLookupItem("tipoAtividadeGeral", name)}
                  onRename={(id, name) => renameLookupItem("tipoAtividadeGeral", id, name)}
                  onDeactivate={(id) => deactivateLookupItem("tipoAtividadeGeral", id)}
                />
                <ManagedMultiSelect
                  label="Setores internos"
                  items={lookups.setorInterno}
                  value={editing.setorIds}
                  onChange={(setorIds) => patch({ setorIds })}
                  onCreate={(name) => addLookupItem("setorInterno", name)}
                  onRename={(id, name) => renameLookupItem("setorInterno", id, name)}
                  onDeactivate={(id) => deactivateLookupItem("setorInterno", id)}
                />
                <div className="flex flex-col gap-1.5">
                  <Label>Nome / Assunto</Label>
                  <Input value={editing.assunto} onChange={(e) => patch({ assunto: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Prazo geral</Label>
                  <Input type="date" value={editing.prazo ?? ""} onChange={(e) => patch({ prazo: e.target.value || null })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => patch({ status: v as AtividadeGeral["status"] })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {STATUS_GERAL_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Prioridade</Label>
                  <Select value={editing.prioridade} onValueChange={(v) => patch({ prioridade: v as AtividadeGeral["prioridade"] })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADE_OPTIONS.map((prioridade) => (
                        <SelectItem key={prioridade} value={prioridade}>{prioridade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Vínculos</Label>
                <Textarea value={editing.vinculos} onChange={(e) => patch({ vinculos: e.target.value })} rows={2} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Descrição</Label>
                <Textarea value={editing.descricao} onChange={(e) => patch({ descricao: e.target.value })} rows={2} />
              </div>
            </div>
          )}
        </div>

        {/* Checklist — elemento principal (~80% da área) */}
        <ChecklistGeralEditor items={editing.checklist} onChange={(checklist) => patch({ checklist })} />
      </div>
    );
  }

  // --- Lista de execuções ---
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Execuções</h2>
          <p className="mt-1 text-muted-foreground">
            Gerenciamento operacional com checklist como foco principal.
          </p>
        </div>
        <Button
          className="gap-2 bg-[var(--base-2)] text-white hover:bg-[var(--base-2)]/90 sm:w-fit"
          onClick={() => {
            const atividade = emptyAtividadeGeral();
            setDraftNew(atividade);
            setEditingId(atividade.id);
            setInfoOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nova Execução
        </Button>
      </div>

      <ExecucaoFilterBar filters={filters} onChange={setFilters} />
      <div className="flex justify-end">
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
          <ClipboardCheck className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            {atividadesGerais.length === 0
              ? "Nenhuma execução cadastrada ainda."
              : "Nenhuma execução encontrada com esses filtros."}
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <ExecucaoCard key={a.id} atividade={a} onOpen={() => setEditingId(a.id)} />
          ))}
        </div>
      ) : (
        <ExecucaoTable atividades={filtered} onOpen={(id) => setEditingId(id)} />
      )}
    </div>
  );
}

function ExecucaoCard({ atividade: a, onOpen }: { atividade: AtividadeGeral; onOpen: () => void }) {
  const { lookups, updateAtividadeGeral } = useAppData();
  const tipos = lookups.tipoAtividadeGeral.filter((t) => a.tipoIds.includes(t.id));
  const setores = lookups.setorInterno.filter((s) => a.setorIds.includes(s.id));
  const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
  const unidade = lookups.unidade.find((u) => u.id === a.unidadeId);
  const total = a.checklist.length;
  const done = a.checklist.filter((c) => c.status === "Concluído").length;
  const pct = completion(a.checklist);
  const concluida = a.status === "Concluído";
  const prazoStatus = a.status !== "Concluído" && a.prazo ? prazoStatusFor(a.prazo) : null;

  return (
    <div
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border-l-4 border-l-[var(--base-2)] bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold leading-tight">
            {empresa?.name ?? "Sem empresa"}
            {unidade && <span className="text-muted-foreground"> · {unidade.name}</span>}
          </p>
          <p className="text-sm text-muted-foreground">{a.assunto || "Sem assunto"}</p>
        </div>
        <button
          type="button"
          title={concluida ? "Reabrir" : "Concluir"}
          onClick={(e) => {
            e.stopPropagation();
            updateAtividadeGeral(a.id, { status: concluida ? "Pendente" : "Concluído" });
          }}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
            concluida
              ? "border-transparent bg-[var(--status-concluido)] text-white"
              : "border-muted-foreground/40 text-transparent hover:border-[var(--status-concluido)]"
          )}
        >
          <Check className="size-4" />
        </button>
      </div>

      {tipos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {tipos.map((t) => (
            <span key={t.id} className="rounded-full border px-2 py-0.5">{t.name}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS_GERAL_STYLES[a.status])}>{a.status}</span>
        <span className={cn("rounded-full px-2 py-0.5 font-medium", PRIORIDADE_STYLES[a.prioridade])}>{a.prioridade}</span>
        {prazoStatus && (
          <span className={cn("rounded-full px-2 py-0.5 font-medium", PRAZO_STYLES[prazoStatus])}>
            {parseLocalDate(a.prazo!).toLocaleDateString("pt-BR")}
          </span>
        )}
        {setores.map((s) => (
          <span key={s.id} className="rounded-full border px-2 py-0.5 text-muted-foreground">{s.name}</span>
        ))}
      </div>

      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="progress-track flex-1">
            <span style={{ width: `${pct}%`, background: "var(--base-2)" }} />
          </div>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{done}/{total}</span>
        </div>
      )}
    </div>
  );
}

function ExecucaoTable({ atividades, onOpen }: { atividades: AtividadeGeral[]; onOpen: (id: string) => void }) {
  const { lookups, updateAtividadeGeral } = useAppData();
  return (
    <div className="panel-card overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-3 py-2" />
            <th className="px-3 py-2 font-medium">Empresa</th>
            <th className="px-3 py-2 font-medium">Assunto</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Prazo</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Prioridade</th>
            <th className="px-3 py-2 font-medium">Setor interno</th>
            <th className="px-3 py-2 font-medium">Checklist</th>
          </tr>
        </thead>
        <tbody>
          {atividades.map((a) => {
            const tipos = lookups.tipoAtividadeGeral.filter((t) => a.tipoIds.includes(t.id)).map((t) => t.name).join(", ") || "-";
            const setores = lookups.setorInterno.filter((s) => a.setorIds.includes(s.id)).map((s) => s.name).join(", ") || "-";
            const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
            const unidade = lookups.unidade.find((u) => u.id === a.unidadeId);
            const concluida = a.status === "Concluído";
            return (
              <tr key={a.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/40" onClick={() => onOpen(a.id)}>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    title={concluida ? "Reabrir" : "Concluir"}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAtividadeGeral(a.id, { status: concluida ? "Pendente" : "Concluído" });
                    }}
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border transition-colors",
                      concluida
                        ? "border-transparent bg-[var(--status-concluido)] text-white"
                        : "border-muted-foreground/40 text-transparent hover:border-[var(--status-concluido)]"
                    )}
                  >
                    <Check className="size-3.5" />
                  </button>
                </td>
                <td className="px-3 py-2 font-medium">{empresa ? `${empresa.name}${unidade ? ` · ${unidade.name}` : ""}` : "-"}</td>
                <td className="px-3 py-2">{a.assunto || "Sem assunto"}</td>
                <td className="px-3 py-2 text-muted-foreground">{tipos}</td>
                <td className="px-3 py-2 text-muted-foreground">{a.prazo ? parseLocalDate(a.prazo).toLocaleDateString("pt-BR") : "-"}</td>
                <td className="px-3 py-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_GERAL_STYLES[a.status])}>{a.status}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", PRIORIDADE_STYLES[a.prioridade])}>{a.prioridade}</span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{setores}</td>
                <td className="px-3 py-2 text-muted-foreground">{completion(a.checklist)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
