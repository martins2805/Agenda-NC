"use client";

import { List, KanbanSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "lista" | "kanban";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-0.5">
      <Button
        type="button"
        variant={value === "lista" ? "secondary" : "ghost"}
        size="sm"
        className="gap-1.5"
        onClick={() => onChange("lista")}
      >
        <List className="size-3.5" />
        Lista
      </Button>
      <Button
        type="button"
        variant={value === "kanban" ? "secondary" : "ghost"}
        size="sm"
        className="gap-1.5"
        onClick={() => onChange("kanban")}
      >
        <KanbanSquare className="size-3.5" />
        Kanban
      </Button>
    </div>
  );
}
