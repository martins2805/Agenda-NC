"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/registros/rich-text-editor";
import { makeRegistroTabId } from "@/lib/app-data-context";
import { cn } from "@/lib/utils";
import type { RegistroTab } from "@/lib/types";

interface RegistroTabsProps {
  tabs: RegistroTab[];
  onChange: (tabs: RegistroTab[]) => void;
}

export function RegistroTabs({ tabs, onChange }: RegistroTabsProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  function addTab() {
    const tab: RegistroTab = {
      id: makeRegistroTabId(),
      titulo: `Aba ${tabs.length + 1}`,
      conteudo: "",
    };
    onChange([...tabs, tab]);
    setActiveId(tab.id);
  }

  function removeTab(id: string) {
    const next = tabs.filter((t) => t.id !== id);
    onChange(next);
    if (activeId === id) setActiveId(next[0]?.id ?? "");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 border-b pb-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-1 rounded-t-md border border-b-0 px-2 py-1 text-sm",
              tab.id === active?.id
                ? "border-border bg-card font-medium"
                : "border-transparent text-muted-foreground hover:bg-muted"
            )}
          >
            {editingId === tab.id ? (
              <Input
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => {
                  if (editingTitle.trim())
                    onChange(
                      tabs.map((t) =>
                        t.id === tab.id ? { ...t, titulo: editingTitle.trim() } : t
                      )
                    );
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-6 w-24 px-1"
              />
            ) : (
              <button
                type="button"
                onClick={() => setActiveId(tab.id)}
                onDoubleClick={() => {
                  setEditingId(tab.id);
                  setEditingTitle(tab.titulo);
                }}
              >
                {tab.titulo}
              </button>
            )}
            {tabs.length > 1 && (
              <button
                type="button"
                onClick={() => removeTab(tab.id)}
                className="rounded-full p-0.5 opacity-0 hover:bg-background/60 group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={addTab}
          aria-label="Nova aba"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {active && (
        <RichTextEditor
          key={active.id}
          content={active.conteudo}
          onChange={(html) =>
            onChange(
              tabs.map((t) => (t.id === active.id ? { ...t, conteudo: html } : t))
            )
          }
        />
      )}
    </div>
  );
}
