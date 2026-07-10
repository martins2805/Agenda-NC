"use client";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export interface KanbanColumn<T> {
  id: string;
  name: string;
  items: T[];
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  onMove: (itemId: string, fromColumnId: string, toColumnId: string) => void;
}

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      className="touch-none"
    >
      {children}
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-24 flex-col gap-3 rounded-lg p-1 transition-colors ${
        isOver ? "bg-primary/[0.06] ring-2 ring-primary/30" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onMove,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const itemId = String(active.id);
    const toColumnId = String(over.id);
    const fromColumn = columns.find((c) => c.items.some((i) => i.id === itemId));
    if (!fromColumn || fromColumn.id === toColumnId) return;
    onMove(itemId, fromColumn.id, toColumnId);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div key={col.id} className="flex w-72 shrink-0 flex-col gap-3">
            <p className="text-sm font-semibold">
              {col.name}{" "}
              <span className="font-mono text-xs font-normal text-muted-foreground">
                ({col.items.length})
              </span>
            </p>
            <DroppableColumn id={col.id}>
              {col.items.map((item) => (
                <DraggableCard key={item.id} id={item.id}>
                  {renderCard(item)}
                </DraggableCard>
              ))}
            </DroppableColumn>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
