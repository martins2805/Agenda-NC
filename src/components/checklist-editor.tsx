"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  CalendarClock,
  X,
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  BookmarkPlus,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { makeChecklistItemId, makeChecklistTemplateId } from "@/lib/app-data-context";
import { formatLocalDateTime, todayLocalDateString } from "@/lib/calculations";
import type { ChecklistItem, ChecklistTemplate } from "@/lib/types";

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  templates?: ChecklistTemplate[];
  onSaveTemplate?: (template: ChecklistTemplate) => void;
}

// Itens concluídos sempre ficam no fim de seu grupo de irmãos (mesmo
// parentId), preservando a ordem relativa entre si e entre os pendentes.
// Array.prototype.sort é estável (ES2019+), então isso não embaralha nada.
function normalizeChecklist(items: ChecklistItem[]): ChecklistItem[] {
  const byParent = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const key = item.parentId ?? "";
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }
  function sortGroup(list: ChecklistItem[] | undefined) {
    return [...(list ?? [])].sort((a, b) => Number(a.concluido) - Number(b.concluido));
  }
  const top = sortGroup(byParent.get(""));
  const result: ChecklistItem[] = [];
  for (const item of top) {
    result.push(item);
    result.push(...sortGroup(byParent.get(item.id)));
  }
  return result;
}

const NONE = "__none__";

export function ChecklistEditor({
  items,
  onChange,
  templates = [],
  onSaveTemplate,
}: ChecklistEditorProps) {
  const [draft, setDraft] = useState("");

  function commit(next: ChecklistItem[]) {
    onChange(normalizeChecklist(next));
  }

  function addItem(parentId: string | null = null) {
    const texto = draft.trim();
    if (!texto) return;
    commit([
      ...items,
      { id: makeChecklistItemId(), texto, concluido: false, prazo: null, parentId },
    ]);
    setDraft("");
  }

  function addSubitem(parentId: string) {
    commit([
      ...items,
      { id: makeChecklistItemId(), texto: "", concluido: false, prazo: null, parentId },
    ]);
  }

  function updateItem(id: string, patch: Partial<ChecklistItem>) {
    commit(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    commit(items.filter((i) => i.id !== id && i.parentId !== id));
  }

  function moveItem(id: string, direction: -1 | 1) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const siblings = items.filter((i) => i.parentId === item.parentId);
    const idx = siblings.findIndex((i) => i.id === id);
    const target = siblings[idx + direction];
    if (!target) return;
    const next = [...items];
    const posA = next.findIndex((i) => i.id === id);
    const posB = next.findIndex((i) => i.id === target.id);
    [next[posA], next[posB]] = [next[posB], next[posA]];
    commit(next);
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const idMap = new Map<string, string>();
    template.itens.forEach((i) => idMap.set(i.id, makeChecklistItemId()));
    const novos: ChecklistItem[] = template.itens.map((i) => ({
      id: idMap.get(i.id)!,
      texto: i.texto,
      concluido: false,
      prazo: null,
      parentId: i.parentId ? idMap.get(i.parentId) ?? null : null,
    }));
    commit([...items, ...novos]);
  }

  function saveAsTemplate() {
    if (items.length === 0 || !onSaveTemplate) return;
    const nome = window.prompt("Nome do modelo de checklist:");
    if (!nome?.trim()) return;
    onSaveTemplate({
      id: makeChecklistTemplateId(),
      nome: nome.trim(),
      itens: items.map((i) => ({ id: i.id, texto: i.texto, parentId: i.parentId })),
    });
  }

  const topLevel = items.filter((i) => !i.parentId);
  const subitemsOf = (id: string) => items.filter((i) => i.parentId === id);

  function renderRow(item: ChecklistItem, isSub: boolean) {
    const siblings = items.filter((i) => i.parentId === item.parentId);
    const idx = siblings.findIndex((i) => i.id === item.id);
    return (
      <div
        key={item.id}
        className={`flex flex-col gap-1 rounded-md border px-2 py-1.5 ${isSub ? "ml-6 border-dashed" : ""}`}
      >
        <div className="flex items-center gap-2">
          {isSub && <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />}
          <div className="flex shrink-0 flex-col">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground disabled:opacity-30"
              disabled={idx === 0}
              title="Mover para cima"
              onClick={() => moveItem(item.id, -1)}
            >
              <ChevronUp className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-4 text-muted-foreground disabled:opacity-30"
              disabled={idx === siblings.length - 1}
              title="Mover para baixo"
              onClick={() => moveItem(item.id, 1)}
            >
              <ChevronDown className="size-3" />
            </Button>
          </div>
          <Checkbox
            checked={item.concluido}
            onCheckedChange={(checked) =>
              updateItem(item.id, { concluido: checked === true })
            }
          />
          <Input
            value={item.texto}
            onChange={(e) => updateItem(item.id, { texto: e.target.value })}
            className={`h-8 min-w-0 flex-1 border-none px-1 shadow-none focus-visible:ring-0 ${
              item.concluido ? "text-muted-foreground line-through" : ""
            }`}
          />
          {!isSub && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              title="Adicionar subitem"
              onClick={() => addSubitem(item.id)}
            >
              <CornerDownRight className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-7 shrink-0 ${item.prazo ? "text-primary" : "text-muted-foreground"}`}
            title={item.prazo ? "Alterar prazo" : "Adicionar prazo"}
            onClick={() =>
              updateItem(item.id, {
                prazo: item.prazo ?? todayLocalDateString(),
              })
            }
          >
            <CalendarClock className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-destructive"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        {item.prazo && (
          <div className="ml-12 flex items-center gap-1.5">
            <Input
              type="datetime-local"
              value={item.prazo}
              onChange={(e) => updateItem(item.id, { prazo: e.target.value || null })}
              className="h-7 w-fit text-xs"
            />
            <span className="text-xs text-muted-foreground">
              {formatLocalDateTime(item.prazo)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-muted-foreground"
              title="Remover prazo"
              onClick={() => updateItem(item.id, { prazo: null })}
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">Checklist de próximos passos</label>
        <div className="flex items-center gap-1.5">
          {templates.length > 0 && (
            <Select
              items={{
                [NONE]: "Aplicar modelo",
                ...Object.fromEntries(templates.map((t) => [t.id, t.nome])),
              }}
              value={NONE}
              onValueChange={(v) => v && v !== NONE && applyTemplate(v)}
            >
              <SelectTrigger className="h-7 w-40 text-xs">
                <SelectValue placeholder="Aplicar modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Aplicar modelo</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="size-3.5" />
                      {t.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onSaveTemplate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              disabled={items.length === 0}
              onClick={saveAsTemplate}
            >
              <BookmarkPlus className="size-3.5" />
              Salvar como modelo
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {topLevel.map((item) => (
          <div key={item.id} className="flex flex-col gap-1.5">
            {renderRow(item, false)}
            {subitemsOf(item.id).map((sub) => renderRow(sub, true))}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Novo item..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={() => addItem()}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
