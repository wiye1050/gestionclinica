'use client';

import { ReactNode, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface KanbanColumn<T> {
  id: string;
  title: string;
  color?: string;
  items: T[];
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, index: number) => ReactNode;
  onDragEnd: (itemId: string, fromColumn: string, toColumn: string) => void;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

interface SortableCardProps {
  id: string;
  children: ReactNode;
}

function SortableCard({ id, children }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function KanbanBoard<T>({
  columns,
  renderCard,
  onDragEnd,
  keyExtractor,
  emptyMessage = 'No hay elementos'
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar columnas origen y destino
    let fromColumn = '';
    let toColumn = '';

    for (const col of columns) {
      if (col.items.find(item => keyExtractor(item) === activeId)) {
        fromColumn = col.id;
      }
      if (col.id === overId || col.items.find(item => keyExtractor(item) === overId)) {
        toColumn = col.id;
      }
    }

    if (fromColumn && toColumn && fromColumn !== toColumn) {
      onDragEnd(activeId, fromColumn, toColumn);
    }

    setActiveId(null);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col gap-3">
            {/* Header de columna */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-700 shadow-sm">
                {column.items.length}
              </span>
            </div>

            {/* Items */}
            <SortableContext
              id={column.id}
              items={column.items.map(keyExtractor)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 min-h-[200px]">
                {column.items.length === 0 ? (
                  <div className="surface-card p-4 text-center text-sm text-text-muted">
                    {emptyMessage}
                  </div>
                ) : (
                  column.items.map((item, index) => (
                    <SortableCard key={keyExtractor(item)} id={keyExtractor(item)}>
                      {renderCard(item, index)}
                    </SortableCard>
                  ))
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="opacity-75">
            {/* Placeholder durante drag */}
            <div className="surface-card p-4">
              <p className="text-sm text-gray-900">Arrastrando...</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
