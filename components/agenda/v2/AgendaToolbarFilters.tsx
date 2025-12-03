import type { AgendaEvent } from './agendaHelpers';
import type { Sala } from '@/types';

export const ESTADO_FILTERS: Array<{
  id: AgendaEvent['estado'] | 'todos';
  label: string;
  className: string;
}> = [
  { id: 'todos', label: 'Todos', className: 'border border-border text-text-muted' },
  { id: 'programada', label: 'Programadas', className: 'bg-yellow-100 text-yellow-800' },
  { id: 'confirmada', label: 'Confirmadas', className: 'bg-green-100 text-green-800' },
  { id: 'realizada', label: 'Realizadas', className: 'bg-gray-200 text-gray-700' },
  { id: 'cancelada', label: 'Canceladas', className: 'bg-red-100 text-red-800' },
];

export const TIPO_FILTERS: Array<{ id: AgendaEvent['tipo'] | 'todos'; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'consulta', label: 'Consulta' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'revision', label: 'Revisión' },
  { id: 'tratamiento', label: 'Tratamiento' },
  { id: 'urgencia', label: 'Urgencia' },
  { id: 'administrativo', label: 'Administrativo' },
];

const RECURSO_PRESETS = [
  { id: 'todos', label: 'Todos' },
  { id: 'medicina', label: 'Equipo médico' },
  { id: 'fisioterapia', label: 'Fisioterapia' },
  { id: 'enfermeria', label: 'Enfermería' },
];

interface AgendaToolbarFiltersProps {
  // Sala filters
  selectedSala: string;
  salas: Sala[];
  onSalaChange: (sala: string) => void;

  // Tipo filter
  tipoFilter: AgendaEvent['tipo'] | 'todos';
  onTipoChange: (tipo: AgendaEvent['tipo'] | 'todos') => void;

  // Resource preset
  resourcePreset: 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria';
  onResourcePresetChange: (preset: 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria') => void;
  isResourcePresetDisabled: boolean;

  // Estado filter
  estadoFilter: AgendaEvent['estado'] | 'todos';
  onEstadoChange: (estado: AgendaEvent['estado'] | 'todos') => void;

  // View density
  viewDensity: 'comfort' | 'compact';
  onViewDensityChange: (density: 'comfort' | 'compact') => void;

  // Day view mode
  dayViewMode: 'single' | 'multi';
  onDayViewModeChange: (mode: 'single' | 'multi') => void;
}

export default function AgendaToolbarFilters({
  selectedSala,
  salas,
  onSalaChange,
  tipoFilter,
  onTipoChange,
  resourcePreset,
  onResourcePresetChange,
  isResourcePresetDisabled,
  estadoFilter,
  onEstadoChange,
  viewDensity,
  onViewDensityChange,
  dayViewMode,
  onDayViewModeChange,
}: AgendaToolbarFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[9px]">
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={selectedSala}
          onChange={(e) => onSalaChange(e.target.value)}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-[9px] font-semibold text-text focus-visible:focus-ring"
        >
          <option value="todas">Todas las salas</option>
          {salas.map((sala) => (
            <option key={sala.id} value={sala.id}>
              {sala.nombre}
            </option>
          ))}
        </select>

        <select
          value={tipoFilter}
          onChange={(e) => onTipoChange(e.target.value as AgendaEvent['tipo'] | 'todos')}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-[9px] font-semibold text-text focus-visible:focus-ring"
        >
          {TIPO_FILTERS.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.label}
            </option>
          ))}
        </select>

        <select
          value={resourcePreset}
          disabled={isResourcePresetDisabled}
          onChange={(e) =>
            onResourcePresetChange(
              e.target.value as 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria'
            )
          }
          className={`rounded-lg border border-border bg-card px-2 py-1.5 text-[9px] font-semibold text-text focus-visible:focus-ring ${
            isResourcePresetDisabled ? 'cursor-not-allowed opacity-60' : ''
          }`}
        >
          {RECURSO_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {ESTADO_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onEstadoChange(filter.id)}
            className={`rounded-full px-2 py-1 text-[9px] font-semibold transition-all focus-visible:focus-ring ${
              estadoFilter === filter.id
                ? `${filter.className} border border-transparent`
                : 'border border-border text-text-muted hover:bg-cardHover'
            }`}
          >
            {filter.label}
          </button>
        ))}
        <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-[9px] font-semibold text-text-muted">
          {[
            { id: 'comfort', label: 'Amplia' },
            { id: 'compact', label: 'Compacta' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => onViewDensityChange(option.id as 'comfort' | 'compact')}
              className={`rounded-full px-2 py-1 text-[9px] transition-all ${
                viewDensity === option.id
                  ? 'bg-brand text-white'
                  : 'text-text-muted hover:bg-cardHover'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-[9px] font-semibold text-text-muted">
          {[
            { id: 'single', label: 'Una columna' },
            { id: 'multi', label: 'Multi-columna' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => onDayViewModeChange(option.id as 'single' | 'multi')}
              className={`rounded-full px-2 py-1 text-[9px] transition-all ${
                dayViewMode === option.id
                  ? 'bg-brand text-white'
                  : 'text-text-muted hover:bg-cardHover'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
