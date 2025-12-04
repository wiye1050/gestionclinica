'use client';

import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';

interface Profesional {
  id: string;
  nombre: string;
  apellidos: string;
  color?: string;
}

interface ProfesionalFilterListProps {
  profesionales: Profesional[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxVisible?: number;
}

export default function ProfesionalFilterList({
  profesionales,
  selectedIds,
  onChange,
  maxVisible = 8,
}: ProfesionalFilterListProps) {
  const [showAll, setShowAll] = useState(false);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((profId) => profId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === profesionales.length) {
      onChange([]);
    } else {
      onChange(profesionales.map((p) => p.id));
    }
  };

  const visibleProfesionales = showAll ? profesionales : profesionales.slice(0, maxVisible);
  const hasMore = profesionales.length > maxVisible;
  const allSelected = selectedIds.length === profesionales.length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-text-muted" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Profesionales
          </h3>
        </div>
        <button
          onClick={handleToggleAll}
          className="text-xs font-medium text-brand hover:underline"
        >
          {allSelected ? 'Limpiar' : 'Todos'}
        </button>
      </div>

      {/* Lista de profesionales */}
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {visibleProfesionales.map((prof) => {
          const isSelected = selectedIds.includes(prof.id);
          const color = prof.color || '#6B7280';

          return (
            <label
              key={prof.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-cardHover"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(prof.id)}
                className="h-3.5 w-3.5 rounded border-border text-brand focus-visible:ring-2 focus-visible:ring-brand/50"
              />
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-text flex-1 truncate">
                {prof.nombre} {prof.apellidos}
              </span>
              {isSelected && (
                <span className="flex-shrink-0 text-xs font-medium text-brand">✓</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Mostrar más/menos */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-brand hover:text-brand"
        >
          <span>{showAll ? 'Mostrar menos' : `Mostrar todos (${profesionales.length})`}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Info selección */}
      {selectedIds.length > 0 && (
        <div className="rounded-lg bg-brand-subtle px-2 py-1.5 text-xs text-brand">
          <span className="font-medium">{selectedIds.length}</span> seleccionado
          {selectedIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
