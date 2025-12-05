'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
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
import type { VistaAgenda as AgendaView } from '@/components/agenda/v2/agendaConstants';
import { useProfesionalesManager } from '@/lib/hooks/useProfesionalesManager';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import CrossModuleAlert from '@/components/shared/CrossModuleAlert';
import AgendaDayView from '@/components/agenda/v2/AgendaDayView';
import AgendaWeekViewV2 from '@/components/agenda/v2/AgendaWeekViewV2';
import AgendaResourceView from '@/components/agenda/v2/AgendaResourceView';
import EventModal from '@/components/agenda/v2/EventModal';
import AgendaTopBar from '@/components/agenda/v2/layout/AgendaTopBar';
import AgendaSidebar from '@/components/agenda/v2/layout/AgendaSidebar';
import { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import type { SerializedAgendaEvent } from '@/lib/server/agenda';
import type { Paciente } from '@/types';
import { deserializeAgendaEvents } from '@/lib/utils/agendaEvents';
import { useAgendaFilters } from '@/lib/hooks/useAgendaFilters';
import { useAgendaActions } from '@/lib/hooks/useAgendaActions';
import { useAgendaModals } from '@/lib/hooks/useAgendaModals';

// Lazy load AgendaEventDrawer for better performance
const AgendaEventDrawer = dynamic(
  () => import('@/components/agenda/v2/AgendaEventDrawer'),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center"><SkeletonLoader /></div> }
);

export type VistaAgenda = AgendaView;
type AgendaResource = { id: string; nombre: string; tipo: 'profesional' | 'sala' };

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hourHeight = viewDensity === 'compact' ? 60 : viewDensity === 'spacious' ? 120 : 90;

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


  const isResourceGridMode = vista === 'multi' || (vista === 'diaria' && dayViewMode === 'multi');
  const resourceColumnLimit = Math.max(isResourceGridMode ? 6 : 4, 1);

  const recursos = useMemo<AgendaResource[]>(() => {
    // Solo mostrar profesionales seleccionados explícitamente en el filtro
    const seleccionados = selectedProfesionales
      .map((id) => profesionales.find((p) => p.id === id))
      .filter(
        (prof): prof is (typeof profesionales)[number] =>
          Boolean(prof) && (resourcePreset === 'todos' || prof.especialidad === resourcePreset)
      );

    return seleccionados.map((prof) => ({
      id: prof.id,
      nombre: `${prof.nombre} ${prof.apellidos}`,
      tipo: 'profesional',
      color: prof.color ?? '#66b7e1', // fallback azul suave si no hay color asignado
    }));
  }, [profesionales, selectedProfesionales, resourcePreset]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow '/' to focus search even in inputs
        if (e.key === '/' && !target.classList.contains('agenda-search')) {
          e.preventDefault();
          const searchInput = document.querySelector('.agenda-search') as HTMLInputElement;
          searchInput?.focus();
        }
        return;
      }

      // Navigation shortcuts
      if (e.key === 'ArrowLeft' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleNext();
      }
      // View shortcuts (1-4)
      else if (e.key === '1') {
        e.preventDefault();
        setVista('diaria');
      } else if (e.key === '2') {
        e.preventDefault();
        setVista('semanal');
      } else if (e.key === '3') {
        e.preventDefault();
        setVista('multi');
      }
      // Today shortcut
      else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToday();
      }
      // New event shortcut
      else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openModal(new Date());
      }
      // Search focus
      else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.agenda-search') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, handleToday, setVista, openModal]);

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
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* TopBar */}
      <AgendaTopBar
        dateLabel={dateLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        vista={vista}
        onVistaChange={setVista}
        busqueda={busquedaEvento}
        onBusquedaChange={setBusquedaEvento}
        onNewEvent={() => openModal(new Date())}
        eventCount={eventosFiltrados.length}
        viewDensity={viewDensity}
        onViewDensityChange={setViewDensity}
        dayViewMode={dayViewMode}
        onDayViewModeChange={setDayViewMode}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Grid: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Overlay para cerrar sidebar en móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Left - Responsive */}
        <div
          className={`
            fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <AgendaSidebar
            currentDate={currentDate}
            onDateSelect={(date) => {
              setCurrentDate(date);
              setIsSidebarOpen(false); // Cerrar sidebar en móvil al seleccionar fecha
            }}
            onMonthChange={setCurrentDate}
            events={eventosFiltrados}
            profesionales={profesionales}
            selectedProfesionales={selectedProfesionales}
            onProfesionalesChange={setSelectedProfesionales}
            estadoFilter={estadoFilter}
            onEstadoChange={(estado) => setEstadoFilter(estado as typeof estadoFilter)}
            tipoFilter={tipoFilter}
            onTipoChange={(tipo) => setTipoFilter(tipo as typeof tipoFilter)}
            selectedSala={selectedSala}
            salas={salas}
            onSalaChange={setSelectedSala}
            onClearBasicFilters={clearAgendaFilters}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4">
          {/* CrossModule Alert */}
          {highRiskPacientes.length > 0 && (
            <div className="mb-4">
              <CrossModuleAlert
                title="Pacientes de riesgo alto"
                description={`Hay ${highRiskPacientes.length} pacientes marcados con riesgo alto. Revisa su seguimiento antes de continuar con la agenda.`}
                actionLabel="Ver pacientes"
                href="/dashboard/pacientes"
                tone="warn"
                chips={highRiskNames}
              />
            </div>
          )}

          {/* Agenda Views */}
          <div
            className="rounded-lg border border-border bg-card shadow-sm"
            style={{ minHeight: '75vh' }}
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
              recursos.length > 0 ? (
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
              ) : (
                renderPlaceholder(
                  'Selecciona profesionales',
                  'Marca uno o más profesionales en el panel izquierdo para ver sus columnas en la agenda.'
                )
              )
            )}

          </div>
        </main>
      </div>

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
