"use client";

import { useState } from "react";
import { CalendarClock, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { makeChecklistItemId } from "@/lib/app-data-context";
import { todayLocalDateString } from "@/lib/calculations";
import type { ChecklistItem } from "@/lib/types";

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  headerActions?: React.ReactNode;
}

function childrenOf(items: ChecklistItem[], parentId: string | null) {
  const siblings = items.filter((i) => (i.parentId ?? null) === parentId);
  // Itens concluídos vão para o final da lista, preservando a ordem relativa.
  const pending = siblings.filter((i) => !i.concluido);
  const done = siblings.filter((i) => i.concluido);
  return [...pending, ...done];
}

export function ChecklistEditor({ items, onChange, headerActions }: ChecklistEditorProps) {
  const [draft, setDraft] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function addItem(parentId: string | null = null, texto?: string) {
    const value = (texto ?? draft).trim();
    if (!value) return;
    onChange([
      ...items,
      { id: makeChecklistItemId(), texto: value, concluido: false, prazo: null, parentId },
    ]);
    if (!texto) setDraft("");
  }

  function updateItem(id: string, patch: Partial<ChecklistItem>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    // Remove o item e toda a sua descendência (subitens de subitens).
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
    // Só reordena entre irmãos do mesmo nível.
    if ((dragged.parentId ?? null) !== (over.parentId ?? null)) return;
    const from = items.findIndex((item) => item.id === draggingId);
    const to = items.findIndex((item) => item.id === overId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function renderItem(item: ChecklistItem, depth: number) {
    const kids = childrenOf(items, item.id);
    return (
      <div key={item.id} className="flex flex-col gap-1.5">
        <div
          draggable
          onDragStart={() => setDraggingId(item.id)}
          onDragOver={(e) => {
            e.preventDefault();
            moveDragged(item.id);
          }}
          onDragEnd={() => setDraggingId(null)}
          className={`flex flex-col gap-1 rounded-md border px-2 py-1.5 ${
            draggingId === item.id ? "bg-muted shadow-md" : ""
          }`}
          style={{ marginLeft: depth * 24 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="cursor-grab text-muted-foreground active:cursor-grabbing" title="Arrastar para reorganizar">
              <GripVertical className="size-4" />
            </span>
            <Checkbox
              checked={item.concluido}
              onCheckedChange={(checked) =>
                updateItem(item.id, { concluido: checked === true })
              }
            />
            <Input
              value={item.texto}
              onChange={(e) => updateItem(item.id, { texto: e.target.value })}
              className={`h-auto min-h-8 min-w-0 flex-1 border-none px-1 shadow-none focus-visible:ring-0 sm:field-sizing-content sm:flex-initial ${
                item.concluido ? "text-muted-foreground line-through" : ""
              }`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              title="Adicionar subitem"
              onClick={() => addItem(item.id, "Novo subitem")}
            >
              <Plus className="size-3.5" />
            </Button>
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
                type="date"
                value={item.prazo}
                onChange={(e) => updateItem(item.id, { prazo: e.target.value || null })}
                className="h-7 w-fit text-xs"
              />
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
        {kids.map((child) => renderItem(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">Checklist de proximos passos</label>
        {headerActions}
      </div>
      <div className="flex flex-col gap-1.5">
        {childrenOf(items, null).map((item) => renderItem(item, 0))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Novo item..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem(null);
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={() => addItem(null)}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
