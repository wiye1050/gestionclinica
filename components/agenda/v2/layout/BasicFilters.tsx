'use client';

import { SlidersHorizontal, XCircle } from 'lucide-react';

interface Sala {
  id: string;
  nombre: string;
}

interface BasicFiltersProps {
  // Estado
  estadoFilter: string;
  onEstadoChange: (estado: string) => void;

  // Tipo
  tipoFilter: string;
  onTipoChange: (tipo: string) => void;

  // Sala
  selectedSala: string;
  salas: Sala[];
  onSalaChange: (sala: string) => void;

  // Clear all
  onClearAll?: () => void;
}

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'programada', label: 'Programada' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'revision', label: 'Revisión' },
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'administrativo', label: 'Administrativo' },
];

export default function BasicFilters({
  estadoFilter,
  onEstadoChange,
  tipoFilter,
  onTipoChange,
  selectedSala,
  salas,
  onSalaChange,
  onClearAll,
}: BasicFiltersProps) {
  const hasActiveFilters =
    estadoFilter !== 'todos' || tipoFilter !== 'todos' || (selectedSala !== 'todas' && selectedSala !== '');

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Filtros
          </h3>
        </div>
        {hasActiveFilters && onClearAll && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs font-medium text-danger hover:underline"
          >
            <XCircle className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        {/* Estado */}
        <div>
          <label
            htmlFor="filter-estado"
            className="mb-1 block text-xs font-medium text-text"
          >
            Estado
          </label>
          <select
            id="filter-estado"
            value={estadoFilter}
            onChange={(e) => onEstadoChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            {ESTADO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label
            htmlFor="filter-tipo"
            className="mb-1 block text-xs font-medium text-text"
          >
            Tipo
          </label>
          <select
            id="filter-tipo"
            value={tipoFilter}
            onChange={(e) => onTipoChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            {TIPO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sala */}
        <div>
          <label
            htmlFor="filter-sala"
            className="mb-1 block text-xs font-medium text-text"
          >
            Sala
          </label>
          <select
            id="filter-sala"
            value={selectedSala}
            onChange={(e) => onSalaChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option value="todas">Todas las salas</option>
            {salas.map((sala) => (
              <option key={sala.id} value={sala.id}>
                {sala.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
