"use client";

import { useState } from "react";
import { LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppData, makeChecklistTemplateId } from "@/lib/app-data-context";
import { templateFromItems } from "@/lib/checklist-templates";
import type { ChecklistTemplate } from "@/lib/types";

interface ChecklistTemplateManagerProps {
  currentItems: { id: string; texto: string; parentId?: string | null }[];
  onApply: (template: ChecklistTemplate) => void;
}

export function ChecklistTemplateManager({ currentItems, onApply }: ChecklistTemplateManagerProps) {
  const { checklistTemplates, addChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate } =
    useAppData();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  function saveCurrentAsTemplate() {
    const nome = window.prompt("Nome do modelo de checklist:");
    if (!nome?.trim()) return;
    addChecklistTemplate(
      templateFromItems(makeChecklistTemplateId(), nome.trim(), currentItems)
    );
  }

  function renameTemplate(template: ChecklistTemplate, nome: string) {
    if (!nome.trim()) return;
    updateChecklistTemplate(template.id, { ...template, nome: nome.trim() });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <LayoutTemplate className="size-4" />
        Modelos
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="flex flex-col gap-1">
          {checklistTemplates.length === 0 && (
            <p className="px-1 py-1.5 text-xs text-muted-foreground">
              Nenhum modelo salvo ainda.
            </p>
          )}
          {checklistTemplates.map((template) => (
            <div key={template.id} className="flex items-center gap-1 rounded-md px-1 py-1 hover:bg-muted">
              {renamingId === template.id ? (
                <Input
                  autoFocus
                  defaultValue={template.nome}
                  className="h-7 flex-1 text-sm"
                  onBlur={(e) => {
                    renameTemplate(template, e.target.value);
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="flex-1 truncate text-left text-sm"
                  title="Aplicar modelo"
                  onClick={() => {
                    onApply(template);
                    setOpen(false);
                  }}
                >
                  {template.nome}
                </button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-muted-foreground"
                title="Renomear"
                onClick={() => setRenamingId(template.id)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-destructive"
                title="Excluir modelo"
                onClick={() => deleteChecklistTemplate(template.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2 w-full gap-1.5"
          disabled={currentItems.length === 0}
          onClick={saveCurrentAsTemplate}
        >
          <Plus className="size-3.5" />
          Salvar checklist atual como modelo
        </Button>
      </PopoverContent>
    </Popover>
  );
}
