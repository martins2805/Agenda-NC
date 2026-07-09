"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LookupItem } from "@/lib/types";

interface ManagedSelectProps {
  label: string;
  placeholder?: string;
  items: LookupItem[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCreate: (name: string) => string;
  onRename: (id: string, name: string) => void;
  onDeactivate: (id: string) => void;
}

export function ManagedSelect({
  label,
  placeholder = "Selecionar...",
  items,
  value,
  onChange,
  onCreate,
  onRename,
  onDeactivate,
}: ManagedSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const active = items.filter((i) => i.active);
  const selected = items.find((i) => i.id === value);
  const filtered = active.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const exactMatch = active.some(
    (i) => i.name.toLowerCase() === search.trim().toLowerCase()
  );

  function commitCreate() {
    const name = search.trim();
    if (!name) return;
    const id = onCreate(name);
    onChange(id);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-2" align="start">
          <Input
            autoFocus
            placeholder="Buscar ou criar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !exactMatch && search.trim()) {
                e.preventDefault();
                commitCreate();
              }
            }}
            className="mb-2"
          />
          <div className="no-scrollbar max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Nenhum resultado.
              </p>
            )}
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-muted"
              >
                {editingId === item.id ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editingName.trim()) {
                        onRename(item.id, editingName.trim());
                        setEditingId(null);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => {
                      if (editingName.trim()) onRename(item.id, editingName.trim());
                      setEditingId(null);
                    }}
                    className="h-8"
                  />
                ) : (
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
                    onClick={() => {
                      onChange(item.id);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </button>
                )}
                {editingId !== item.id && (
                  <div className="flex opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => {
                        if (value === item.id) onChange(null);
                        onDeactivate(item.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {search.trim() && !exactMatch && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2 w-full justify-start gap-2"
              onClick={commitCreate}
            >
              <Plus className="size-4" />
              Criar &ldquo;{search.trim()}&rdquo;
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
