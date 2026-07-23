"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { makeLinkId } from "@/lib/app-data-context";
import type { Link } from "@/lib/types";

interface LinkEditorProps {
  items: Link[];
  onChange: (items: Link[]) => void;
}

export function LinkEditor({ items, onChange }: LinkEditorProps) {
  const [draftUrl, setDraftUrl] = useState("");

  function addItem() {
    const url = draftUrl.trim();
    if (!url) return;
    onChange([...items, { id: makeLinkId(), titulo: "", url }]);
    setDraftUrl("");
  }

  function updateItem(id: string, patch: Partial<Link>) {
    onChange(items.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeItem(id: string) {
    onChange(items.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Links</label>
      <div className="flex flex-col gap-1.5">
        {items.map((link) => (
          <div key={link.id} className="flex items-center gap-1.5 rounded-md border px-2 py-1.5">
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Título (opcional)"
              value={link.titulo}
              onChange={(e) => updateItem(link.id, { titulo: e.target.value })}
              className="h-auto min-h-8 w-32 shrink-0 border-none px-1 shadow-none focus-visible:ring-0"
            />
            <Input
              value={link.url}
              onChange={(e) => updateItem(link.id, { url: e.target.value })}
              className="h-auto min-h-8 border-none px-1 shadow-none focus-visible:ring-0 field-sizing-content"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-destructive"
              onClick={() => removeItem(link.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Colar um link e clicar em +"
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
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
