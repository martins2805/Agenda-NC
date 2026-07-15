"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
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
import {
  makeAtividadeGeralId,
  makeChecklistGeralItemId,
  useAppData,
} from "@/lib/app-data-context";
import { applyChecklistTemplate } from "@/lib/checklist-templates";
import { PRIORIDADE_OPTIONS } from "@/lib/types";
import type { AtividadeGeral, ChecklistGeralItem } from "@/lib/types";
import { parseLocalDate } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { PRIORIDADE_STYLES, STATUS_GERAL_STYLES } from "@/lib/status-colors";

const CHECKLIST_GERAL_STATUS = ["Pendente", "Em andamento", "Concluído"] as const;

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

function ChecklistGeralEditor({
  items,
  onChange,
}: {
  items: ChecklistGeralItem[];
  onChange: (items: ChecklistGeralItem[]) => void;
}) {
  const { lookups, addLookupItem, renameLookupItem, deactivateLookupItem } = useAppData();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function update(id: string, patch: Partial<ChecklistGeralItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addItem(parentId: string | null = null, empresaId: string | null = null) {
    onChange([...items, { ...emptyChecklistItem(parentId), empresaId }]);
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
            "grid grid-cols-1 gap-2 rounded-md border bg-card p-2",
            draggingId === item.id && "shadow-md"
          )}
          style={{ marginLeft: depth * 24 }}
        >
          <div className="flex items-center gap-2">
            <span className="cursor-grab text-muted-foreground active:cursor-grabbing" title="Arrastar para reorganizar">
              <GripVertical className="size-4" />
            </span>
            <Input
              value={item.texto}
              onChange={(e) => update(item.id, { texto: e.target.value })}
              placeholder={item.parentId ? "Subitem" : "Item"}
              className="field-sizing-content"
            />
          </div>
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
            <Select
              value={item.status}
              onValueChange={(v) => update(item.id, { status: v as ChecklistGeralItem["status"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CHECKLIST_GERAL_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={item.prioridade}
              onValueChange={(v) =>
                update(item.id, { prioridade: v as ChecklistGeralItem["prioridade"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADE_OPTIONS.map((prioridade) => (
                  <SelectItem key={prioridade} value={prioridade}>
                    {prioridade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto text-destructive"
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
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
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Checklist geral</Label>
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
    </div>
  );
}

export default function AtividadesGeraisPage() {
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
  const [keyword, setKeyword] = useState("");

  const editing = draftNew ?? atividadesGerais.find((a) => a.id === editingId) ?? null;

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return atividadesGerais;
    return atividadesGerais.filter((a) => {
      const tipos = lookups.tipoAtividadeGeral
        .filter((t) => a.tipoIds.includes(t.id))
        .map((t) => t.name)
        .join(" ");
      const setores = lookups.setorInterno
        .filter((s) => a.setorIds.includes(s.id))
        .map((s) => s.name)
        .join(" ");
      return [a.assunto, a.descricao, a.vinculos, tipos, setores]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [atividadesGerais, keyword, lookups]);

  function save(atividade: AtividadeGeral) {
    if (draftNew && draftNew.id === atividade.id) {
      addAtividadeGeral(atividade);
      setDraftNew(null);
    } else {
      updateAtividadeGeral(atividade.id, atividade);
    }
  }

  if (editing) {
    const patch = (p: Partial<AtividadeGeral>) => save({ ...editing, ...p });
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditingId(null);
              setDraftNew(null);
            }}
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ManagedSelect
            label="Empresa"
            items={lookups.empresa}
            value={editing.empresaId}
            onChange={(id) =>
              patch(id === editing.empresaId ? { empresaId: id } : { empresaId: id, unidadeId: null })
            }
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
            <Label>Assunto</Label>
            <Input value={editing.assunto} onChange={(e) => patch({ assunto: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Prazo</Label>
            <Input type="date" value={editing.prazo ?? ""} onChange={(e) => patch({ prazo: e.target.value || null })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status de conclusao geral</Label>
            <Select value={editing.status} onValueChange={(v) => patch({ status: v as AtividadeGeral["status"] })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {CHECKLIST_GERAL_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Prioridade</Label>
            <Select value={editing.prioridade} onValueChange={(v) => patch({ prioridade: v as AtividadeGeral["prioridade"] })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                {PRIORIDADE_OPTIONS.map((prioridade) => (
                  <SelectItem key={prioridade} value={prioridade}>
                    {prioridade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Vinculos</Label>
          <Textarea value={editing.vinculos} onChange={(e) => patch({ vinculos: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Descricao</Label>
          <Textarea value={editing.descricao} onChange={(e) => patch({ descricao: e.target.value })} />
        </div>
        <ChecklistGeralEditor items={editing.checklist} onChange={(checklist) => patch({ checklist })} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Atividades gerais</h2>
          <p className="mt-1 text-muted-foreground">
            Fluxo separado das atividades padrao, com setores e checklist proprio.
          </p>
        </div>
        <Button
          className="gap-2 bg-[var(--base-2)] text-white hover:bg-[var(--base-2)]/90 sm:w-fit"
          onClick={() => {
            const atividade = emptyAtividadeGeral();
            setDraftNew(atividade);
            setEditingId(atividade.id);
          }}
        >
          <Plus className="size-4" />
          Nova atividade geral
        </Button>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar atividade geral..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <ViewToggle value={view} onChange={setView} />
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => {
            const tipos = lookups.tipoAtividadeGeral.filter((t) => a.tipoIds.includes(t.id));
            const setores = lookups.setorInterno.filter((s) => a.setorIds.includes(s.id));
            const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
            const unidade = lookups.unidade.find((u) => u.id === a.unidadeId);
            return (
              <button
                key={a.id}
                type="button"
                className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-sm hover:shadow-md"
                onClick={() => setEditingId(a.id)}
              >
                <div>
                  <p className="font-semibold">{a.assunto || "Sem assunto"}</p>
                  <p className="text-sm text-muted-foreground">
                    {tipos.map((t) => t.name).join(", ") || "Sem tipo"}
                  </p>
                  {empresa && (
                    <p className="text-sm text-muted-foreground">
                      {empresa.name}
                      {unidade && ` · ${unidade.name}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS_GERAL_STYLES[a.status])}>{a.status}</span>
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", PRIORIDADE_STYLES[a.prioridade])}>{a.prioridade}</span>
                  {setores.map((s) => (
                    <span key={s.id} className="rounded-full border px-2 py-0.5">{s.name}</span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {a.prazo ? `Prazo: ${parseLocalDate(a.prazo).toLocaleDateString("pt-BR")}` : "Sem prazo"} · Checklist {completion(a.checklist)}%
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Assunto</th>
                <th className="px-3 py-2">Empresa</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Prazo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Setor interno</th>
                <th className="px-3 py-2">Checklist</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const tipos = lookups.tipoAtividadeGeral
                  .filter((t) => a.tipoIds.includes(t.id))
                  .map((t) => t.name)
                  .join(", ") || "-";
                const setores = lookups.setorInterno
                  .filter((s) => a.setorIds.includes(s.id))
                  .map((s) => s.name)
                  .join(", ") || "-";
                const empresa = lookups.empresa.find((e) => e.id === a.empresaId);
                const unidade = lookups.unidade.find((u) => u.id === a.unidadeId);
                return (
                  <tr key={a.id} className="cursor-pointer border-t hover:bg-muted/30" onClick={() => setEditingId(a.id)}>
                    <td className="px-3 py-2 font-medium">{a.assunto || "Sem assunto"}</td>
                    <td className="px-3 py-2">
                      {empresa ? `${empresa.name}${unidade ? ` · ${unidade.name}` : ""}` : "-"}
                    </td>
                    <td className="px-3 py-2">{tipos}</td>
                    <td className="px-3 py-2">{a.prazo ? parseLocalDate(a.prazo).toLocaleDateString("pt-BR") : "-"}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_GERAL_STYLES[a.status])}>{a.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIORIDADE_STYLES[a.prioridade])}>{a.prioridade}</span>
                    </td>
                    <td className="px-3 py-2">{setores}</td>
                    <td className="px-3 py-2">{completion(a.checklist)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
