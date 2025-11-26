'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, SlidersHorizontal } from 'lucide-react';
import type { AgendaEvent } from './agendaHelpers';

interface CollapsibleToolbarProps {
  // Navigation
  dateLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;

  // Stats
  eventCount: number;

  // Action button
  onNewEvent: () => void;

  // Filters
  children?: React.ReactNode;

  // Active filters (for chips display)
  activeFilters?: {
    profesionales?: string[];
    sala?: string;
    tipo?: string;
    estado?: string;
    resourcePreset?: string;
    viewDensity?: 'comfort' | 'compact';
    dayViewMode?: 'single' | 'multi';
  };

  // Filter labels for display
  profesionalesLabel?: string;
  salaLabel?: string;
  tipoLabel?: string;
  estadoLabel?: string;

  // Clear handlers
  onClearProfesionales?: () => void;
  onClearSala?: () => void;
  onClearTipo?: () => void;
  onClearEstado?: () => void;
}

export default function CollapsibleToolbar({
  dateLabel,
  onPrev,
  onNext,
  onToday,
  eventCount,
  onNewEvent,
  children,
  activeFilters = {},
  profesionalesLabel,
  salaLabel,
  tipoLabel,
  estadoLabel,
  onClearProfesionales,
  onClearSala,
  onClearTipo,
  onClearEstado,
}: CollapsibleToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine which filters are active
  const hasActiveProfesionales = (activeFilters.profesionales?.length ?? 0) > 0;
  const hasActiveSala = activeFilters.sala && activeFilters.sala !== 'todas';
  const hasActiveTipo = activeFilters.tipo && activeFilters.tipo !== 'todos';
  const hasActiveEstado = activeFilters.estado && activeFilters.estado !== 'todos';

  const activeFilterCount = [
    hasActiveProfesionales,
    hasActiveSala,
    hasActiveTipo,
    hasActiveEstado,
  ].filter(Boolean).length;

  return (
    <section className="rounded-lg border border-border bg-card p-2 shadow-sm transition-all hover:shadow-md">
      {/* Compact Header - Always Visible */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 shadow-sm">
            <button
              onClick={onPrev}
              className="rounded-full p-1 text-text hover:bg-cardHover focus-visible:focus-ring"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onToday}
              className="rounded-full border border-border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-text hover:bg-cardHover focus-visible:focus-ring"
            >
              Hoy
            </button>
            <button
              onClick={onNext}
              className="rounded-full p-1 text-text hover:bg-cardHover focus-visible:focus-ring"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-lg bg-cardHover px-2 py-1 text-xs font-semibold capitalize text-text shadow-sm">
            {dateLabel}
          </div>

          <span className="rounded-full border border-dashed border-border bg-card px-2 py-1 text-[9px] font-semibold text-text-muted">
            {eventCount} eventos
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Filter toggle button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[9px] font-semibold transition-all focus-visible:focus-ring ${
              isExpanded
                ? 'border-brand bg-brand text-white shadow-sm hover:bg-brand/90'
                : activeFilterCount > 0
                ? 'border-brand bg-brand-subtle text-brand hover:bg-brand-subtle/80'
                : 'border-border bg-cardHover text-text hover:bg-cardHover/80'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className={`rounded-full px-1.5 text-[8px] font-bold ${
                isExpanded ? 'bg-white/20 text-white' : 'bg-brand text-white'
              }`}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Nueva cita button */}
          <button
            onClick={onNewEvent}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1.5 text-[9px] font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus-visible:focus-ring"
          >
            <Plus className="h-3.5 w-3.5" /> Nueva cita
          </button>
        </div>
      </div>

      {/* Active Filters Chips - Shown when collapsed */}
      {!isExpanded && activeFilterCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
          {hasActiveProfesionales && profesionalesLabel && (
            <div className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-1 text-[9px] font-semibold text-brand">
              <span>{profesionalesLabel}</span>
              {onClearProfesionales && (
                <button
                  onClick={onClearProfesionales}
                  className="rounded-full hover:bg-brand/10"
                  aria-label="Limpiar filtro de profesionales"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {hasActiveSala && salaLabel && (
            <div className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-1 text-[9px] font-semibold text-brand">
              <span>{salaLabel}</span>
              {onClearSala && (
                <button
                  onClick={onClearSala}
                  className="rounded-full hover:bg-brand/10"
                  aria-label="Limpiar filtro de sala"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {hasActiveTipo && tipoLabel && (
            <div className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-1 text-[9px] font-semibold text-brand">
              <span>{tipoLabel}</span>
              {onClearTipo && (
                <button
                  onClick={onClearTipo}
                  className="rounded-full hover:bg-brand/10"
                  aria-label="Limpiar filtro de tipo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {hasActiveEstado && estadoLabel && (
            <div className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-1 text-[9px] font-semibold text-brand">
              <span>{estadoLabel}</span>
              {onClearEstado && (
                <button
                  onClick={onClearEstado}
                  className="rounded-full hover:bg-brand/10"
                  aria-label="Limpiar filtro de estado"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Expanded Filters - Shown when expanded */}
      {isExpanded && (
        <div className="mt-2 space-y-2 border-t border-border pt-2">
          {children}
        </div>
      )}
    </section>
  );
}
