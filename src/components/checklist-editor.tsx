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
}

export function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const [draft, setDraft] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function addItem() {
    const texto = draft.trim();
    if (!texto) return;
    onChange([...items, { id: makeChecklistItemId(), texto, concluido: false, prazo: null }]);
    setDraft("");
  }

  function updateItem(id: string, patch: Partial<ChecklistItem>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function moveDragged(overId: string) {
    if (!draggingId || draggingId === overId) return;
    const from = items.findIndex((item) => item.id === draggingId);
    const to = items.findIndex((item) => item.id === overId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Checklist de proximos passos</label>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div
            key={item.id}
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
          >
            <div className="flex items-center gap-2">
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
                className={`h-auto min-h-8 border-none px-1 shadow-none focus-visible:ring-0 ${
                  item.concluido ? "text-muted-foreground line-through" : ""
                }`}
              />
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
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
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
        <Button type="button" variant="secondary" onClick={addItem}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
