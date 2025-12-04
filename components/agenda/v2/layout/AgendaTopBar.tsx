'use client';

import { ChevronLeft, ChevronRight, Search, Plus, Calendar, List, LayoutGrid, Boxes, Maximize2, Minimize2, Grid3x3, Menu } from 'lucide-react';
import type { VistaAgenda } from '@/app/dashboard/agenda/AgendaClient';

type ViewDensity = 'compact' | 'normal' | 'spacious';
type DayViewMode = 'single' | 'multi';

interface AgendaTopBarProps {
  // Navegación de fecha
  dateLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;

  // Vista
  vista: VistaAgenda;
  onVistaChange: (vista: VistaAgenda) => void;

  // Búsqueda
  busqueda: string;
  onBusquedaChange: (value: string) => void;

  // Nueva cita
  onNewEvent: () => void;

  // Contador de eventos
  eventCount: number;

  // Density controls (opcionales)
  viewDensity?: ViewDensity;
  onViewDensityChange?: (density: ViewDensity) => void;
  dayViewMode?: DayViewMode;
  onDayViewModeChange?: (mode: DayViewMode) => void;

  // Mobile sidebar toggle
  onToggleSidebar?: () => void;
}

const VISTA_OPTIONS: Array<{
  id: VistaAgenda;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'diaria', label: 'Día', icon: <Calendar className="h-3.5 w-3.5" /> },
  { id: 'semanal', label: 'Semana', icon: <List className="h-3.5 w-3.5" /> },
  { id: 'multi', label: 'Multi', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: 'boxes', label: 'Boxes', icon: <Boxes className="h-3.5 w-3.5" /> },
];

export default function AgendaTopBar({
  dateLabel,
  onPrev,
  onNext,
  onToday,
  vista,
  onVistaChange,
  busqueda,
  onBusquedaChange,
  onNewEvent,
  eventCount,
  viewDensity,
  onViewDensityChange,
  dayViewMode,
  onDayViewModeChange,
  onToggleSidebar,
}: AgendaTopBarProps) {
  return (
    <header className="sticky top-0 z-20 rounded-lg border border-border bg-gradient-to-r from-card via-card to-brand-subtle/5 shadow-md backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2">
        {/* Left: Navegación de fecha */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="rounded-lg border border-brand/20 bg-brand/5 p-1.5 text-brand transition-all hover:bg-brand/10 hover:border-brand/30 focus-visible:focus-ring lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
          {/* Controles de navegación */}
          <div className="flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/5 px-1.5 py-1 shadow-sm">
            <button
              onClick={onPrev}
              className="rounded p-1 text-brand transition-all hover:bg-brand/10 focus-visible:focus-ring"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onToday}
              className="rounded border border-brand/30 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-brand transition-all hover:bg-brand hover:text-white hover:border-brand focus-visible:focus-ring"
            >
              Hoy
            </button>
            <button
              onClick={onNext}
              className="rounded p-1 text-brand transition-all hover:bg-brand/10 focus-visible:focus-ring"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Label de fecha */}
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand/80 px-3 py-1.5 text-sm font-semibold capitalize text-white shadow-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span>{dateLabel}</span>
          </div>

          {/* Contador de eventos */}
          <div className="hidden rounded-full bg-gradient-to-r from-brand-subtle to-brand-subtle/50 px-3 py-1 text-xs font-semibold text-brand shadow-sm sm:inline-flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            <span>{eventCount} {eventCount === 1 ? 'evento' : 'eventos'}</span>
          </div>
        </div>

        {/* Right: Vista + Búsqueda + Nueva cita */}
        <div className="flex items-center gap-2">
          {/* Selector de vista */}
          <div className="flex items-center gap-0.5 rounded-lg border border-brand/30 bg-gradient-to-r from-card to-brand-subtle/10 p-1 shadow-sm">
            {VISTA_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => onVistaChange(option.id)}
                disabled={option.id === 'boxes'}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all focus-visible:focus-ring ${
                  vista === option.id
                    ? 'bg-brand text-white shadow-md scale-105'
                    : option.id === 'boxes'
                    ? 'cursor-not-allowed text-text-muted/50 opacity-40'
                    : 'text-text hover:bg-card hover:text-brand'
                }`}
                title={option.id === 'boxes' ? 'Próximamente' : undefined}
              >
                {option.icon}
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Density controls */}
          {onViewDensityChange && viewDensity && (
            <div className="hidden items-center gap-0.5 rounded-lg border border-brand/30 bg-gradient-to-r from-card to-brand-subtle/10 p-1 shadow-sm xl:flex" title="Densidad">
              <button
                onClick={() => onViewDensityChange('compact')}
                className={`rounded-md p-1.5 transition-all focus-visible:focus-ring ${
                  viewDensity === 'compact' ? 'bg-brand text-white shadow-sm' : 'text-text hover:bg-card hover:text-brand'
                }`}
                aria-label="Compacto"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewDensityChange('normal')}
                className={`rounded-md p-1.5 transition-all focus-visible:focus-ring ${
                  viewDensity === 'normal' ? 'bg-brand text-white shadow-sm' : 'text-text hover:bg-card hover:text-brand'
                }`}
                aria-label="Normal"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewDensityChange('spacious')}
                className={`rounded-md p-1.5 transition-all focus-visible:focus-ring ${
                  viewDensity === 'spacious' ? 'bg-brand text-white shadow-sm' : 'text-text hover:bg-card hover:text-brand'
                }`}
                aria-label="Espacioso"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Day View Mode (solo visible en vista diaria) */}
          {vista === 'diaria' && onDayViewModeChange && dayViewMode && (
            <div className="hidden items-center gap-0.5 rounded-lg border border-brand/30 bg-gradient-to-r from-card to-brand-subtle/10 p-1 shadow-sm xl:flex" title="Modo vista diaria">
              <button
                onClick={() => onDayViewModeChange('single')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all focus-visible:focus-ring ${
                  dayViewMode === 'single' ? 'bg-brand text-white shadow-sm' : 'text-text hover:bg-card hover:text-brand'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Single</span>
              </button>
              <button
                onClick={() => onDayViewModeChange('multi')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all focus-visible:focus-ring ${
                  dayViewMode === 'multi' ? 'bg-brand text-white shadow-sm' : 'text-text hover:bg-card hover:text-brand'
                }`}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                <span>Multi</span>
              </button>
            </div>
          )}

          {/* Búsqueda */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Buscar (presiona /)"
              className="agenda-search w-48 rounded-lg border border-brand/30 bg-card py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-muted shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand hover:border-brand/40 lg:w-64"
            />
          </div>

          {/* Botón Nueva cita */}
          <button
            onClick={onNewEvent}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-success/90 hover:shadow-md focus-visible:focus-ring"
            title="Nueva cita (presiona N)"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva cita</span>
          </button>
        </div>
      </div>

      {/* Búsqueda móvil (row separada) */}
      <div className="border-t border-border p-2 md:hidden">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar..."
            className="agenda-search w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
      </div>
    </header>
  );
}
