"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarClock, X, ChevronUp, ChevronDown } from "lucide-react";
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

  function addItem() {
    const texto = draft.trim();
    if (!texto) return;
    onChange([...items, { id: makeChecklistItemId(), texto, concluido: false, prazo: null }]);
    setDraft("");
  }

  function updateItem(id: string, patch: Partial<ChecklistItem>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Checklist de próximos passos</label>
      <div className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-1 rounded-md border px-2 py-1.5">
            <div className="flex items-center gap-2">
              <div className="flex shrink-0 flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-4 text-muted-foreground disabled:opacity-30"
                  disabled={index === 0}
                  title="Mover para cima"
                  onClick={() => moveItem(index, -1)}
                >
                  <ChevronUp className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-4 text-muted-foreground disabled:opacity-30"
                  disabled={index === items.length - 1}
                  title="Mover para baixo"
                  onClick={() => moveItem(index, 1)}
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
                className={`h-8 border-none px-1 shadow-none focus-visible:ring-0 ${
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
