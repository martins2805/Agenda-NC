"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Settings2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/lib/app-data-context";
import {
  resolveWidgetPreferencias,
  WIDGET_DEFINITIONS,
  type WidgetPreferenciaResolvida,
  type WidgetTamanho,
} from "@/lib/dashboard-widgets";

// Mesmo padrão de drag-and-drop de src/components/kanban-board.tsx
// (useDraggable/useDroppable puro do @dnd-kit/core, sem @dnd-kit/sortable).
function DraggableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="touch-none"
    >
      {children}
    </div>
  );
}

function DroppableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`rounded-md transition-colors ${isOver ? "bg-[var(--base-1)]/10" : ""}`}>
      {children}
    </div>
  );
}

// Botão de configuração de widgets (Cap. 4, Área 1 — cabeçalho): visibilidade,
// ordem (drag-and-drop) e tamanho, persistidos em WidgetPreferencia.
export function WidgetConfigPanel() {
  const { widgetPreferencias, updateWidgetPreferencias } = useAppData();
  const [open, setOpen] = useState(false);
  const resolved = resolveWidgetPreferencias(widgetPreferencias);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  function persist(next: WidgetPreferenciaResolvida[]) {
    updateWidgetPreferencias(next.map((p, i) => ({ ...p, ordem: i })));
  }

  function toggleVisivel(widgetId: string) {
    persist(resolved.map((p) => (p.widgetId === widgetId ? { ...p, visivel: !p.visivel } : p)));
  }

  function setTamanho(widgetId: string, tamanho: WidgetTamanho) {
    persist(resolved.map((p) => (p.widgetId === widgetId ? { ...p, tamanho } : p)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = resolved.findIndex((p) => p.widgetId === active.id);
    const toIndex = resolved.findIndex((p) => p.widgetId === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...resolved];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persist(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15"
            title="Configurar widgets"
          />
        }
      >
        <Settings2 className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <p className="px-1.5 pb-2 text-xs font-medium text-muted-foreground">Widgets do dashboard</p>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-1">
            {resolved.map((pref) => {
              const def = WIDGET_DEFINITIONS.find((d) => d.id === pref.widgetId);
              if (!def) return null;
              return (
                <DroppableRow key={pref.widgetId} id={pref.widgetId}>
                  <DraggableRow id={pref.widgetId}>
                    <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5">
                      <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                      <span className={`flex-1 truncate text-sm ${!pref.visivel ? "text-muted-foreground" : ""}`}>
                        {def.titulo}
                      </span>
                      <Select value={pref.tamanho} onValueChange={(v) => setTamanho(pref.widgetId, v as WidgetTamanho)}>
                        <SelectTrigger className="h-7 w-[5.5rem] shrink-0 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="largo">Largo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        title={pref.visivel ? "Ocultar widget" : "Mostrar widget"}
                        onClick={() => toggleVisivel(pref.widgetId)}
                      >
                        {pref.visivel ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
                      </Button>
                    </div>
                  </DraggableRow>
                </DroppableRow>
              );
            })}
          </div>
        </DndContext>
      </PopoverContent>
    </Popover>
  );
}
