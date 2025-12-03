'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { addDays, addWeeks, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEventosAgenda,
  useSalas,
  usePacientes,
  useCatalogoServicios,
} from '@/lib/hooks/useQueries';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import CrossModuleAlert from '@/components/shared/CrossModuleAlert';
import AgendaDayView from '@/components/agenda/v2/AgendaDayView';
import AgendaWeekViewV2 from '@/components/agenda/v2/AgendaWeekViewV2';
import AgendaResourceView from '@/components/agenda/v2/AgendaResourceView';
import EventModal from '@/components/agenda/v2/EventModal';
import AgendaEventDrawer from '@/components/agenda/v2/AgendaEventDrawer';
import MiniCalendar from '@/components/agenda/v2/MiniCalendar';
import CollapsibleToolbar from '@/components/agenda/v2/CollapsibleToolbar';
import AgendaToolbarFilters, { ESTADO_FILTERS, TIPO_FILTERS } from '@/components/agenda/v2/AgendaToolbarFilters';
import WeekDaySelector from '@/components/agenda/v2/WeekDaySelector';
import PrimaryTabs from '@/components/shared/PrimaryTabs';
import { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import { CalendarDays, List, LayoutGrid, Boxes, ChevronRight } from 'lucide-react';
import type { SerializedAgendaEvent } from '@/lib/server/agenda';
import type { Paciente } from '@/types';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';
import { deserializeAgendaEvents } from '@/lib/utils/agendaEvents';
import { useAgendaFilters } from '@/lib/hooks/useAgendaFilters';
import { useAgendaActions } from '@/lib/hooks/useAgendaActions';
import { useAgendaModals } from '@/lib/hooks/useAgendaModals';

export type VistaAgenda = 'diaria' | 'semanal' | 'multi' | 'boxes' | 'paciente';
type AgendaResource = { id: string; nombre: string; tipo: 'profesional' | 'sala' };

const VIEW_TABS: Array<{ id: VistaAgenda; label: string; helper: string; icon: ReactNode }> = [
  { id: 'diaria', label: 'Diaria', helper: 'Detalle por horas', icon: <CalendarDays className="h-4 w-4" /> },
  { id: 'semanal', label: 'Semanal', helper: 'Vista cronológica', icon: <List className="h-4 w-4" /> },
  { id: 'multi', label: 'Multi', helper: 'Columnas por profesional', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'boxes', label: 'Boxes', helper: 'Flujo por salas', icon: <Boxes className="h-4 w-4" /> },
];

interface AgendaClientProps {
  initialWeekStart: string;
  initialEvents: SerializedAgendaEvent[];
  prefillRequest?: {
    openModal?: boolean;
    pacienteId?: string;
    pacienteNombre?: string;
    profesionalId?: string;
    forcedView?: VistaAgenda;
    presetProfesionales?: string[];
    targetDate?: string;
  };
}

export default function AgendaClient({
  initialWeekStart,
  initialEvents,
  prefillRequest,
}: AgendaClientProps) {
  const prefetchedEvents = useMemo(() => deserializeAgendaEvents(initialEvents), [initialEvents]);
  const initialWeekStartDate = useMemo(() => new Date(initialWeekStart), [initialWeekStart]);

  // Filters and view state (extracted to hook)
  const {
    selectedProfesionales,
    setSelectedProfesionales,
    selectedSala,
    setSelectedSala,
    estadoFilter,
    setEstadoFilter,
    tipoFilter,
    setTipoFilter,
    busquedaEvento,
    setBusquedaEvento,
    resourcePreset,
    setResourcePreset,
    vista,
    setVista,
    viewDensity,
    setViewDensity,
    dayViewMode,
    setDayViewMode,
    filtersLoaded,
    clearFilters: clearAgendaFilters,
  } = useAgendaFilters();

  // Modal and drawer state (managed by useAgendaModals hook)
  const {
    isModalOpen,
    modalInitialDate,
    eventToEdit,
    modalPrefill,
    openModal,
    openEditModal,
    closeModal,
    drawerEvent,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
  } = useAgendaModals({ prefillRequest });

  const [currentDate, setCurrentDate] = useState(() => initialWeekStartDate);

  const hourHeight = viewDensity === 'compact' ? 60 : 90;

  // Handle prefill request (from URL params)
  useEffect(() => {
    if (!prefillRequest) return;
    if (prefillRequest.forcedView) {
      setVista(prefillRequest.forcedView);
    }
    if (prefillRequest.presetProfesionales && prefillRequest.presetProfesionales.length > 0) {
      setSelectedProfesionales(prefillRequest.presetProfesionales);
    }
  }, [prefillRequest, setVista, setSelectedProfesionales]);

  useEffect(() => {
    if (!prefillRequest?.targetDate) return;
    const parsed = new Date(prefillRequest.targetDate);
    if (!Number.isNaN(parsed.getTime())) {
      setCurrentDate(parsed);
    }
  }, [prefillRequest?.targetDate]);

  const queryClient = useQueryClient();

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const invalidateAgenda = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['agenda-eventos'] }),
    [queryClient]
  );

  // CRUD actions (extracted to hook)
  const {
    handleEventMove,
    handleEventResize,
    handleReassignProfessional,
    handleInlineUpdate,
    handleQuickAction,
    handleSaveEvent,
  } = useAgendaActions(invalidateAgenda);

  const {
    data: eventosData = prefetchedEvents,
    isLoading: loadingEventos,
  } = useEventosAgenda(weekStart, {
    initialData: prefetchedEvents.length > 0 ? prefetchedEvents : undefined,
  });
  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionalesManager();
  const { data: salas = [], isLoading: loadingSalas } = useSalas();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: catalogoServicios = [] } = useCatalogoServicios();

  const loading =
    (loadingEventos && prefetchedEvents.length === 0) ||
    loadingProfesionales ||
    loadingSalas ||
    loadingPacientes;

  const eventos: AgendaEvent[] = useMemo(() => eventosData ?? [], [eventosData]);

  const pacienteOptions = useMemo(
    (): Array<{ id: string; nombre: string; apellidos: string }> => {
      return pacientes.map((paciente) => ({
        id: paciente.id,
        nombre: paciente.nombre ?? 'Sin nombre',
        apellidos: paciente.apellidos ?? '',
      }));
    },
    [pacientes]
  );

  const pacienteMap = useMemo(() => {
    const map = new Map<string, Paciente>();
    pacientes.forEach((paciente) => {
      if (paciente.id) {
        map.set(paciente.id, paciente as Paciente);
      }
    });
    return map;
  }, [pacientes]);

  const drawerPaciente = drawerEvent?.pacienteId
    ? pacienteMap.get(drawerEvent.pacienteId) ?? null
    : null;

  const highRiskPacientes = useMemo(
    () => pacientes.filter((paciente) => paciente.riesgo === 'alto'),
    [pacientes]
  );
  const highRiskNames = useMemo(
    () =>
      highRiskPacientes
        .slice(0, 3)
        .map((paciente) => `${paciente.nombre ?? ''} ${paciente.apellidos ?? ''}`.trim() || 'Paciente'),
    [highRiskPacientes]
  );

  const normalizedEventSearch = busquedaEvento.trim().toLowerCase();

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const matchProfesional =
        selectedProfesionales.length === 0 ||
        selectedProfesionales.includes(evento.profesionalId || '');
      const matchSala = selectedSala === 'todas' || evento.salaId === selectedSala;
      const matchEstado = estadoFilter === 'todos' || evento.estado === estadoFilter;
      const matchTipo = tipoFilter === 'todos' || evento.tipo === tipoFilter;
      const searchablePaciente =
        evento.pacienteNombre ||
        (evento.pacienteId ? pacienteMap.get(evento.pacienteId)?.nombre ?? '' : '');
      const searchableProfesional = evento.profesionalNombre ?? '';
      const searchableTitulo = evento.titulo ?? '';
      const combinedText = `${searchableTitulo} ${searchablePaciente} ${searchableProfesional}`.toLowerCase();
      const matchBusqueda = normalizedEventSearch.length === 0 || combinedText.includes(normalizedEventSearch);
      return matchProfesional && matchSala && matchEstado && matchTipo && matchBusqueda;
    });
  }, [
    eventos,
    selectedProfesionales,
    selectedSala,
    estadoFilter,
    tipoFilter,
    normalizedEventSearch,
    pacienteMap,
  ]);

  const agendaStats = useMemo(() => {
    const total = eventosFiltrados.length;
    const confirmadas = eventosFiltrados.filter((evento) => evento.estado === 'confirmada').length;
    const programadas = eventosFiltrados.filter((evento) => evento.estado === 'programada').length;
    const canceladas = eventosFiltrados.filter((evento) => evento.estado === 'cancelada').length;
    const realizadas = eventosFiltrados.filter((evento) => evento.estado === 'realizada').length;
    return { total, confirmadas, programadas, canceladas, realizadas };
  }, [eventosFiltrados]);

  const agendaKpis = useMemo(
    () => [
      {
        id: 'total',
        label: 'Eventos visibles',
        value: agendaStats.total,
        helper: 'Según filtros aplicados',
        accent: 'brand' as const,
      },
      {
        id: 'programadas',
        label: 'Programadas',
        value: agendaStats.programadas,
        helper: 'Pendientes por confirmar',
        accent: 'blue' as const,
      },
      {
        id: 'confirmadas',
        label: 'Confirmadas',
        value: agendaStats.confirmadas,
        helper: 'Listas para ejecutar',
        accent: 'green' as const,
      },
      {
        id: 'canceladas',
        label: 'Canceladas',
        value: agendaStats.canceladas,
        helper: 'Requieren seguimiento',
        accent: 'red' as const,
      },
      {
        id: 'realizadas',
        label: 'Realizadas',
        value: agendaStats.realizadas,
        helper: 'Completadas esta vista',
        accent: 'purple' as const,
      },
    ],
    [agendaStats]
  );

  const isResourceGridMode = vista === 'multi' || (vista === 'diaria' && dayViewMode === 'multi');
  const resourceColumnLimit = Math.max(isResourceGridMode ? 6 : 4, 1);

  const recursos = useMemo<AgendaResource[]>(() => {
    const cumplePreset = (prof?: (typeof profesionales)[number]) => {
      if (!prof) return false;
      if (resourcePreset === 'todos') return true;
      return prof.especialidad === resourcePreset;
    };

    const selectedOrdered = selectedProfesionales
      .map((id) => profesionales.find((p) => p.id === id))
      .filter((prof): prof is (typeof profesionales)[number] => Boolean(prof));

    const fallbackProfesionales = profesionales.filter(cumplePreset);

    const orderedPool: (typeof profesionales)[number][] = [];
    const pushUnique = (prof?: (typeof profesionales)[number]) => {
      if (!prof) return;
      if (orderedPool.some((item) => item.id === prof.id)) return;
      orderedPool.push(prof);
    };

    selectedOrdered.forEach(pushUnique);

    if (orderedPool.length < resourceColumnLimit) {
      fallbackProfesionales.forEach((prof) => {
        if (orderedPool.length >= resourceColumnLimit) return;
        pushUnique(prof);
      });
    }

    if (orderedPool.length < resourceColumnLimit) {
      profesionales.forEach((prof) => {
        if (orderedPool.length >= resourceColumnLimit) return;
        pushUnique(prof);
      });
    }

    const finalProfesionales = orderedPool.slice(0, resourceColumnLimit);

    return finalProfesionales.map((prof) => ({
      id: prof.id,
      nombre: `${prof.nombre} ${prof.apellidos}`,
      tipo: 'profesional',
    }));
  }, [profesionales, selectedProfesionales, resourcePreset, resourceColumnLimit]);

  // Navigation handlers
  const handlePrev = () => {
    if (vista === 'semanal') {
      setCurrentDate((prev) => addWeeks(prev, -1));
    } else {
      setCurrentDate((prev) => addDays(prev, -1));
    }
  };

  const handleNext = () => {
    if (vista === 'semanal') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Focus agenda on specific event
  const focusAgendaOnEvent = (profesionalId?: string | null, fechaInicio?: Date) => {
    if (fechaInicio instanceof Date) {
      setCurrentDate(fechaInicio);
    }
    if (profesionalId) {
      setSelectedProfesionales((prev) => {
        if (prev.length === 0) return [profesionalId];
        if (prev.includes(profesionalId)) return prev;
        return [...prev, profesionalId];
      });
    }
    setVista('multi');
  };

  const handleCreateEvent = async (start: Date) => {
    openModal(start);
  };

  const handleEventClick = (evento: AgendaEvent) => {
    openDrawer(evento);
  };

  const handleEditFromDrawer = (evento: AgendaEvent) => {
    openEditModal(evento);
    closeDrawer();
  };

  // Wrappers to pass eventos array to hook functions
  const handleEventMoveWrapper = (eventId: string, newStart: Date, newResourceId?: string) => {
    return handleEventMove(eventId, newStart, newResourceId, eventos);
  };

  const handleEventResizeWrapper = (eventId: string, newDurationMinutes: number) => {
    return handleEventResize(eventId, newDurationMinutes, eventos);
  };

  // Wrapper for handleSaveEvent from hook with modal cleanup
  const handleSaveEventWrapper = async (eventData: Partial<AgendaEvent>) => {
    await handleSaveEvent(eventData, eventToEdit, (profesionalId, fechaInicio) => {
      focusAgendaOnEvent(profesionalId, fechaInicio);
      closeModal();
    });
  };

  const dateLabel = useMemo(() => {
    if (vista === 'semanal') {
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(
        weekEnd,
        "d 'de' MMMM, yyyy",
        { locale: es }
      )}`;
    }

    return format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es });
  }, [vista, currentDate, weekStart]);

  const weekDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(weekStart, index);
      return {
        date,
        label: format(date, 'EEE', { locale: es }),
        dayNumber: format(date, 'd', { locale: es }),
        isToday: isSameDay(date, today),
        isSelected: isSameDay(date, currentDate),
      };
    });
  }, [weekStart, currentDate]);

  // Compute filter labels for chips (must be before any conditional returns)
  const profesionalesLabel = useMemo(() => {
    if (selectedProfesionales.length === 0) return undefined;
    return selectedProfesionales.length === 1
      ? profesionales.find((p) => p.id === selectedProfesionales[0])?.nombre
      : `${selectedProfesionales.length} profesionales`;
  }, [selectedProfesionales, profesionales]);

  const salaLabel = useMemo(() => {
    if (!selectedSala || selectedSala === 'todas') return undefined;
    return salas.find((s) => s.id === selectedSala)?.nombre;
  }, [selectedSala, salas]);

  const tipoLabel = useMemo(() => {
    if (!tipoFilter || tipoFilter === 'todos') return undefined;
    return TIPO_FILTERS.find((t) => t.id === tipoFilter)?.label;
  }, [tipoFilter]);

  const estadoLabel = useMemo(() => {
    if (!estadoFilter || estadoFilter === 'todos') return undefined;
    return ESTADO_FILTERS.find((e) => e.id === estadoFilter)?.label;
  }, [estadoFilter]);

  const agendaFilterChips: ActiveFilterChip[] = [];
  if (busquedaEvento.trim()) {
    agendaFilterChips.push({
      id: 'busqueda',
      label: 'Búsqueda',
      value: busquedaEvento,
      onRemove: () => setBusquedaEvento(''),
    });
  }
  if (profesionalesLabel) {
    agendaFilterChips.push({
      id: 'profesionales',
      label: 'Profesionales',
      value: profesionalesLabel,
      onRemove: () => setSelectedProfesionales([]),
    });
  }
  if (salaLabel) {
    agendaFilterChips.push({
      id: 'sala',
      label: 'Sala',
      value: salaLabel,
      onRemove: () => setSelectedSala('todas'),
    });
  }
  if (tipoLabel) {
    agendaFilterChips.push({
      id: 'tipo',
      label: 'Tipo',
      value: tipoLabel,
      onRemove: () => setTipoFilter('todos'),
    });
  }
  if (estadoLabel) {
    agendaFilterChips.push({
      id: 'estado',
      label: 'Estado',
      value: estadoLabel,
      onRemove: () => setEstadoFilter('todos'),
    });
  }


  const renderPlaceholder = (title: string, description: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-lg font-semibold text-text">{title}</p>
      <p className="max-w-md text-sm text-text-muted">{description}</p>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-4">
      <KPIGrid items={agendaKpis} />

      <CompactFilters
        search={{
          value: busquedaEvento,
          onChange: setBusquedaEvento,
          placeholder: 'Buscar por paciente, profesional o servicio',
        }}
        selects={[
          {
            id: 'estado',
            label: 'Estado',
            value: estadoFilter,
            onChange: (value) => setEstadoFilter(value as typeof estadoFilter),
            options: ESTADO_FILTERS.map((option) => ({ value: option.id, label: option.label })),
          },
          {
            id: 'tipo',
            label: 'Tipo',
            value: tipoFilter,
            onChange: (value) => setTipoFilter(value as typeof tipoFilter),
            options: TIPO_FILTERS.map((option) => ({ value: option.id, label: option.label })),
          },
          {
            id: 'sala',
            label: 'Sala',
            value: selectedSala,
            onChange: setSelectedSala,
            options: [
              { value: 'todas', label: 'Todas las salas' },
              ...salas.map((sala) => ({ value: sala.id, label: sala.nombre })),
            ],
          },
        ]}
        activeFilters={agendaFilterChips}
        onClear={agendaFilterChips.length ? clearAgendaFilters : undefined}
      />

      <CollapsibleToolbar
        dateLabel={dateLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        eventCount={eventosFiltrados.length}
        onNewEvent={() => openModal(new Date())}
        activeFilters={{
          profesionales: selectedProfesionales,
          sala: selectedSala,
          tipo: tipoFilter,
          estado: estadoFilter,
        }}
        profesionalesLabel={profesionalesLabel}
        salaLabel={salaLabel}
        tipoLabel={tipoLabel}
        estadoLabel={estadoLabel}
        onClearProfesionales={() => setSelectedProfesionales([])}
        onClearSala={() => setSelectedSala('todas')}
        onClearTipo={() => setTipoFilter('todos')}
        onClearEstado={() => setEstadoFilter('todos')}
      >
        {/* Filter Controls - Only shown when expanded */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <details className="group" title="Profesionales visibles">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 text-[9px] font-semibold text-text shadow-sm transition-colors hover:bg-cardHover">
                  <span>
                    {selectedProfesionales.length === 0
                      ? 'Todos los profesionales'
                      : `${selectedProfesionales.length} seleccionado${
                          selectedProfesionales.length > 1 ? 's' : ''
                        }`}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-text-muted transition-transform group-open:rotate-90" />
                </summary>
                <div className="absolute left-0 z-50 mt-1 max-h-60 min-w-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                  <div className="space-y-0.5 p-1.5 text-xs">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-cardHover">
                      <input
                        type="checkbox"
                        checked={selectedProfesionales.length === 0}
                        onChange={() => setSelectedProfesionales([])}
                        className="h-3.5 w-3.5 rounded border-border text-brand focus-visible:ring-2 focus-visible:ring-brand/50"
                      />
                      <span>Todos</span>
                    </label>
                    {profesionales.map((prof) => (
                      <label
                        key={prof.id}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-cardHover"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProfesionales.includes(prof.id)}
                          onChange={(e) => {
                            setSelectedProfesionales((prev) =>
                              e.target.checked ? [...prev, prof.id] : prev.filter((id) => id !== prof.id)
                            );
                          }}
                          className="h-3.5 w-3.5 rounded border-border text-brand focus-visible:ring-2 focus-visible:ring-brand/50"
                        />
                        <span>
                          {prof.nombre} {prof.apellidos}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </details>
            </div>

            <AgendaToolbarFilters
              selectedSala={selectedSala}
              salas={salas}
              onSalaChange={setSelectedSala}
              tipoFilter={tipoFilter}
              onTipoChange={setTipoFilter}
              resourcePreset={resourcePreset}
              onResourcePresetChange={setResourcePreset}
              isResourcePresetDisabled={vista !== 'multi'}
              estadoFilter={estadoFilter}
              onEstadoChange={setEstadoFilter}
              viewDensity={viewDensity}
              onViewDensityChange={setViewDensity}
              dayViewMode={dayViewMode}
              onDayViewModeChange={setDayViewMode}
            />
          </div>
        </div>
      </CollapsibleToolbar>

      {highRiskPacientes.length > 0 && (
        <CrossModuleAlert
          title="Pacientes de riesgo alto"
          description={`Hay ${highRiskPacientes.length} pacientes marcados con riesgo alto. Revisa su seguimiento antes de continuar con la agenda.`}
          actionLabel="Ver pacientes"
          href="/dashboard/pacientes"
          tone="warn"
          chips={highRiskNames}
        />
      )}

      <section className="rounded-lg border border-border bg-card shadow-sm p-2 transition-all hover:shadow-md">
        <PrimaryTabs
          tabs={VIEW_TABS}
          current={vista}
          onChange={(tab) => setVista(tab)}
          size="sm"
          disabledTabs={['boxes']}
          disabledMessage="Vista en desarrollo - Próximamente"
        />

        <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div
            className="rounded-lg border border-border bg-cardHover/30 p-2"
            style={{ minHeight: '65vh' }}
          >
          {vista === 'diaria' &&
            (dayViewMode === 'single' ? (
              <AgendaDayView
                day={currentDate}
                events={eventosFiltrados}
                onEventMove={handleEventMoveWrapper}
                onEventResize={handleEventResizeWrapper}
                onEventClick={handleEventClick}
                onQuickAction={handleQuickAction}
                onCreateEvent={handleCreateEvent}
                hourHeight={hourHeight}
                catalogoServicios={catalogoServicios}
              />
            ) : (
              <AgendaResourceView
                day={currentDate}
                events={eventosFiltrados}
                resources={recursos}
                onEventMove={handleEventMoveWrapper}
                onEventResize={handleEventResizeWrapper}
                onEventClick={handleEventClick}
                onQuickAction={handleQuickAction}
                hourHeight={hourHeight}
                catalogoServicios={catalogoServicios}
              />
            ))}

          {vista === 'semanal' && (
            <AgendaWeekViewV2
              weekStart={weekStart}
              events={eventosFiltrados}
              onEventMove={handleEventMoveWrapper}
              onEventResize={handleEventResizeWrapper}
              onEventClick={handleEventClick}
              onQuickAction={handleQuickAction}
              hourHeight={hourHeight}
              catalogoServicios={catalogoServicios}
            />
          )}

          {vista === 'multi' && (
            <AgendaResourceView
              day={currentDate}
              events={eventosFiltrados}
              resources={recursos}
              onEventMove={handleEventMoveWrapper}
              onEventResize={handleEventResizeWrapper}
              onEventClick={handleEventClick}
              onQuickAction={handleQuickAction}
              hourHeight={hourHeight}
              catalogoServicios={catalogoServicios}
            />
          )}

            {vista === 'boxes' &&
              renderPlaceholder(
                'Vista de boxes en preparación',
                'Aquí podrás organizar la ocupación de cada box y gestionar bloqueos. Lo dejaremos preparado para la siguiente fase.'
              )}

            {vista === 'paciente' &&
              renderPlaceholder(
                'Vista por paciente',
                'Consulta la historia completa de citas, documentos y notas de un paciente en un único timeline.'
              )}
          </div>

          <aside className="flex flex-col gap-2 rounded-lg border border-border bg-cardHover/30 p-2">
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={setCurrentDate}
              onMonthChange={setCurrentDate}
              events={eventosFiltrados}
            />
            <WeekDaySelector weekDays={weekDays} onDateSelect={setCurrentDate} />
          </aside>
        </div>
      </section>

      <EventModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveEventWrapper}
        event={eventToEdit}
        initialDate={modalInitialDate}
        profesionales={profesionales}
        salas={salas}
        pacientes={pacienteOptions as Array<{ id: string; nombre: string; apellidos: string }>}
        prefillPacienteId={modalPrefill?.pacienteId}
        prefillProfesionalId={modalPrefill?.profesionalId}
      />

      <AgendaEventDrawer
        isOpen={isDrawerOpen && Boolean(drawerEvent)}
        event={drawerEvent}
        paciente={drawerPaciente ?? null}
        onClose={closeDrawer}
        onEdit={handleEditFromDrawer}
        onAction={handleQuickAction}
        profesionales={profesionales.map((prof) => ({
          id: prof.id,
          nombre: `${prof.nombre} ${prof.apellidos}`,
        }))}
        onReassign={handleReassignProfessional}
        onUpdateEvent={handleInlineUpdate}
      />
    </div>
  );
}

export function AgendaClientWrapper(props: AgendaClientProps) {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <AgendaClient {...props} />
    </Suspense>
  );
}
