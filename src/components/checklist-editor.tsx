"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { makeChecklistItemId } from "@/lib/app-data-context";
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
    onChange([...items, { id: makeChecklistItemId(), texto, concluido: false }]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Checklist de próximos passos</label>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
            <Checkbox
              checked={item.concluido}
              onCheckedChange={(checked) =>
                onChange(
                  items.map((i) =>
                    i.id === item.id ? { ...i, concluido: checked === true } : i
                  )
                )
              }
            />
            <Input
              value={item.texto}
              onChange={(e) =>
                onChange(
                  items.map((i) =>
                    i.id === item.id ? { ...i, texto: e.target.value } : i
                  )
                )
              }
              className={`h-8 border-none px-1 shadow-none focus-visible:ring-0 ${
                item.concluido ? "text-muted-foreground line-through" : ""
              }`}
            />
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
