'use client';

import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableWidgetProps {
  id: string;
  children: ReactNode;
  isDragging?: boolean;
}

/**
 * Wrapper que hace un widget arrastrable
 * Usa @dnd-kit/sortable para drag & drop
 */
export function DraggableWidget({ id, children }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle - solo visible en hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-2 z-10 cursor-grab rounded-lg bg-white/90 p-1 shadow-md opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>

      {children}
    </div>
  );
}
