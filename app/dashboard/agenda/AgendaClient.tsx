'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { addDays, addWeeks, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEventosAgenda,
  useProfesionales,
  useSalas,
  usePacientes,
} from '@/lib/hooks/useQueries';
import ModuleHeader from '@/components/shared/ModuleHeader';
import ViewSelector from '@/components/shared/ViewSelector';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import AgendaDayView from '@/components/agenda/v2/AgendaDayView';
import AgendaWeekViewV2 from '@/components/agenda/v2/AgendaWeekViewV2';
import AgendaResourceView from '@/components/agenda/v2/AgendaResourceView';
import EventModal from '@/components/agenda/v2/EventModal';
import AgendaEventDrawer from '@/components/agenda/v2/AgendaEventDrawer';
import MiniCalendar from '@/components/agenda/v2/MiniCalendar';
import AgendaSearch from '@/components/agenda/v2/AgendaSearch';
import { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import AgendaMetrics from '@/components/agenda/v2/AgendaMetrics';
import { Calendar, List, Users as UsersIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SerializedAgendaEvent } from '@/lib/server/agenda';
import type { Paciente, Profesional } from '@/types';

type VistaAgenda = 'dia' | 'semana' | 'recursos';
type AgendaResource = { id: string; nombre: string; tipo: 'profesional' | 'sala' };

const AGENDA_STORAGE_KEY = 'agenda.filters.v1';

const ESTADO_FILTERS: Array<{
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

const TIPO_FILTERS: Array<{ id: AgendaEvent['tipo'] | 'todos'; label: string }> = [
  { id: 'todos', label: 'Todos los tipos' },
  { id: 'consulta', label: 'Consulta' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'revision', label: 'Revisión' },
  { id: 'tratamiento', label: 'Tratamiento' },
  { id: 'urgencia', label: 'Urgencia' },
  { id: 'administrativo', label: 'Administrativo' },
];

const RECURSO_PRESETS = [
  { id: 'todos', label: 'Todos los recursos' },
  { id: 'medicina', label: 'Equipo médico' },
  { id: 'fisioterapia', label: 'Fisioterapia' },
  { id: 'enfermeria', label: 'Enfermería' },
];

function deserializeEvents(serialized: SerializedAgendaEvent[]): AgendaEvent[] {
  return serialized.map((event) => ({
    ...event,
    fechaInicio: new Date(event.fechaInicio),
    fechaFin: new Date(event.fechaFin),
    estado: (event.estado as AgendaEvent['estado']) ?? 'programada',
    tipo: (event.tipo as AgendaEvent['tipo']) ?? 'consulta',
    prioridad: event.prioridad ? (event.prioridad as AgendaEvent['prioridad']) : undefined,
  }));
}

interface AgendaClientProps {
  initialWeekStart: string;
  initialEvents: SerializedAgendaEvent[];
}

export default function AgendaClient({ initialWeekStart, initialEvents }: AgendaClientProps) {
  const prefetchedEvents = useMemo(() => deserializeEvents(initialEvents), [initialEvents]);
  const initialWeekStartDate = useMemo(() => new Date(initialWeekStart), [initialWeekStart]);

  const [vista, setVista] = useState<VistaAgenda>('semana');
  const [currentDate, setCurrentDate] = useState(() => initialWeekStartDate);
  const [selectedProfesionales, setSelectedProfesionales] = useState<string[]>([]);
  const [selectedSala, setSelectedSala] = useState<string>('todas');
  const [estadoFilter, setEstadoFilter] = useState<AgendaEvent['estado'] | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = useState<AgendaEvent['tipo'] | 'todos'>('todos');
  const [resourcePreset, setResourcePreset] =
    useState<'todos' | 'medicina' | 'fisioterapia' | 'enfermeria'>('todos');
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();
  const [eventToEdit, setEventToEdit] = useState<AgendaEvent | null>(null);
  const [drawerEvent, setDrawerEvent] = useState<AgendaEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === 'undefined' || filtersLoaded) return;
    try {
      const raw = window.localStorage.getItem(AGENDA_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        profesionales?: string[];
        sala?: string;
        estado?: AgendaEvent['estado'] | 'todos';
        tipo?: AgendaEvent['tipo'] | 'todos';
        preset?: 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria';
      };
      if (Array.isArray(saved?.profesionales)) {
        setSelectedProfesionales(saved.profesionales);
      }
      if (saved?.sala) {
        setSelectedSala(saved.sala);
      }
      if (saved?.estado) {
        setEstadoFilter(saved.estado);
      }
      if (saved?.tipo) {
        setTipoFilter(saved.tipo);
      }
      if (saved?.preset) {
        setResourcePreset(saved.preset);
      }
    } catch (error) {
      console.warn('[agenda] No se pudieron cargar los filtros persistidos', error);
    } finally {
      setFiltersLoaded(true);
    }
  }, [filtersLoaded]);

  useEffect(() => {
    if (!filtersLoaded || typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({
        profesionales: selectedProfesionales,
        sala: selectedSala,
        estado: estadoFilter,
        tipo: tipoFilter,
        preset: resourcePreset,
      });
      window.localStorage.setItem(AGENDA_STORAGE_KEY, payload);
    } catch (error) {
      console.warn('[agenda] No se pudieron guardar los filtros', error);
    }
  }, [selectedProfesionales, selectedSala, estadoFilter, tipoFilter, resourcePreset, filtersLoaded]);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const invalidateAgenda = () => queryClient.invalidateQueries({ queryKey: ['agenda-eventos'] });

  const {
    data: eventosData = prefetchedEvents,
    isLoading: loadingEventos,
  } = useEventosAgenda(weekStart, {
    initialData: prefetchedEvents.length > 0 ? prefetchedEvents : undefined,
  });
  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionales();
  const { data: salas = [], isLoading: loadingSalas } = useSalas();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();

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

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const matchProfesional =
        selectedProfesionales.length === 0 ||
        selectedProfesionales.includes(evento.profesionalId || '');
      const matchSala = selectedSala === 'todas' || evento.salaId === selectedSala;
      const matchEstado = estadoFilter === 'todos' || evento.estado === estadoFilter;
      const matchTipo = tipoFilter === 'todos' || evento.tipo === tipoFilter;
      return matchProfesional && matchSala && matchEstado && matchTipo;
    });
  }, [eventos, selectedProfesionales, selectedSala, estadoFilter, tipoFilter]);

  const recursos = useMemo<AgendaResource[]>(() => {
    const cumplePreset = (prof?: (typeof profesionales)[number]) => {
      if (!prof) return false;
      if (resourcePreset === 'todos') return true;
      return prof.especialidad === resourcePreset;
    };

    const seleccionados =
      selectedProfesionales.length > 0
        ? selectedProfesionales
            .map((id) => profesionales.find((p) => p.id === id))
            .filter((prof): prof is (typeof profesionales)[number] => Boolean(prof) && cumplePreset(prof))
        : [];

    const baseProfesionales =
      seleccionados.length > 0
        ? seleccionados
        : profesionales.filter(cumplePreset).slice(0, 5);

    return baseProfesionales.map((prof) => ({
      id: prof.id,
      nombre: `${prof.nombre} ${prof.apellidos}`,
      tipo: 'profesional',
    }));
  }, [profesionales, selectedProfesionales, resourcePreset]);

  const requestAgenda = async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });
    let data: Record<string, unknown> = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) {
      const message = typeof data.error === 'string' ? data.error : 'Operación de agenda no disponible.';
      throw new Error(message);
    }
    return data;
  };

  type EventPayload = Partial<AgendaEvent> & {
    servicioId?: string | null;
    requiereSeguimiento?: boolean;
  };
  const serializeEventPayload = (data: EventPayload) => {
    const payload: Record<string, unknown> = {};
    if (data.titulo !== undefined) payload.titulo = data.titulo;
    if (data.tipo !== undefined) payload.tipo = data.tipo;
    if (data.estado !== undefined) payload.estado = data.estado;
    if (data.prioridad !== undefined) payload.prioridad = data.prioridad;
    if (data.notas !== undefined) payload.notas = data.notas;
    if (data.requiereSeguimiento !== undefined) payload.requiereSeguimiento = data.requiereSeguimiento;
    if (data.fechaInicio instanceof Date) payload.fechaInicio = data.fechaInicio.toISOString();
    if (data.fechaFin instanceof Date) payload.fechaFin = data.fechaFin.toISOString();
    if (data.profesionalId !== undefined) payload.profesionalId = data.profesionalId || null;
    if (data.pacienteId !== undefined) payload.pacienteId = data.pacienteId || null;
    if (data.salaId !== undefined) payload.salaId = data.salaId || null;
    if (data.servicioId !== undefined) payload.servicioId = data.servicioId || null;
    return payload;
  };

  const handlePrev = () => {
    if (vista === 'dia') {
      setCurrentDate((prev) => addDays(prev, -1));
    } else {
      setCurrentDate((prev) => addWeeks(prev, -1));
    }
  };

  const handleNext = () => {
    if (vista === 'dia') {
      setCurrentDate((prev) => addDays(prev, 1));
    } else {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventMove = async (eventId: string, newStart: Date, newResourceId?: string) => {
    try {
      const evento = eventos.find((e) => e.id === eventId);
      if (!evento) return;

      const duration = evento.fechaFin.getTime() - evento.fechaInicio.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      const payload: Record<string, unknown> = {
        fechaInicio: newStart.toISOString(),
        fechaFin: newEnd.toISOString(),
      };

      if (newResourceId && newResourceId !== evento.profesionalId) {
        payload.profesionalId = newResourceId;
      }

      await requestAgenda(`/api/agenda/eventos/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await invalidateAgenda();
      toast.success('Evento actualizado');
    } catch (error) {
      console.error('Error al mover evento:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el evento');
    }
  };

  const handleEventResize = async (eventId: string, newDurationMinutes: number) => {
    try {
      const evento = eventos.find((e) => e.id === eventId);
      if (!evento) return;

      const newEnd = new Date(evento.fechaInicio.getTime() + newDurationMinutes * 60000);
      await requestAgenda(`/api/agenda/eventos/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ fechaFin: newEnd.toISOString() }),
      });
      await invalidateAgenda();
      toast.success('Duración actualizada');
    } catch (error) {
      console.error('Error al redimensionar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar duración');
    }
  };

  const handleQuickAction = async (
    evento: AgendaEvent,
    action: 'confirm' | 'complete' | 'cancel'
  ) => {
    try {
      const nuevoEstado =
        action === 'confirm' ? 'confirmada' : action === 'complete' ? 'realizada' : 'cancelada';

      await requestAgenda(`/api/agenda/eventos/${evento.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: nuevoEstado,
          __quickAction: action,
          __eventoTitulo: evento.titulo,
          __pacienteNombre: evento.pacienteNombre ?? null,
          __profesionalNombre: evento.profesionalNombre ?? null,
        }),
      });
      await invalidateAgenda();

      const mensajes = {
        confirm: 'Cita confirmada',
        complete: 'Cita completada',
        cancel: 'Cita cancelada',
      } as const;

      toast.success(mensajes[action]);
    } catch (error) {
      console.error('Error en acción rápida:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    }
  };

  const handleCreateEvent = async (start: Date) => {
    setModalInitialDate(start);
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (evento: AgendaEvent) => {
    setDrawerEvent(evento);
    setIsDrawerOpen(true);
  };

  const handleEditFromDrawer = (evento: AgendaEvent) => {
    setEventToEdit(evento);
    setModalInitialDate(evento.fechaInicio);
    setIsModalOpen(true);
    setIsDrawerOpen(false);
  };

  const handleSaveEvent = async (eventData: Partial<AgendaEvent>) => {
    try {
      if (!eventData.fechaInicio || !eventData.fechaFin) {
        toast.error('Faltan datos de fecha para la cita');
        return;
      }

      const payload = serializeEventPayload(eventData as EventPayload);

      if (eventToEdit) {
        await requestAgenda(`/api/agenda/eventos/${eventToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Cita actualizada');
      } else {
        const titulo = payload.titulo as string | undefined;
        const profesionalId = payload.profesionalId as string | undefined;
        const fechaInicioIso = payload.fechaInicio as string | undefined;
        const fechaFinIso = payload.fechaFin as string | undefined;

        if (!titulo || !profesionalId || !fechaInicioIso || !fechaFinIso) {
          toast.error('Completa título, profesional y horario de la cita.');
          return;
        }

        payload.estado = (eventData.estado as AgendaEvent['estado']) ?? 'programada';

        await requestAgenda('/api/agenda/eventos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Cita creada');
      }

      await invalidateAgenda();
      setIsModalOpen(false);
      setEventToEdit(null);
      setModalInitialDate(undefined);
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar la cita');
      throw error;
    }
  };

  const dateLabel = useMemo(() => {
    if (vista === 'dia') {
      return format(currentDate, "d 'de' MMMM, yyyy", { locale: es });
    } else {
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'd MMM', { locale: es })} - ${format(
        weekEnd,
        'd MMM yyyy',
        { locale: es }
      )}`;
    }
  }, [vista, currentDate, weekStart]);

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Agenda"
        description="Planifica y gestiona citas, recursos y disponibilidad del equipo"
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden w-64 md:block">
              <AgendaSearch
                events={eventos}
                onEventSelect={handleEventClick}
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  setVista('dia');
                }}
              />
            </div>
            <button
              onClick={() => {
                setModalInitialDate(new Date());
                setEventToEdit(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-brand/90 focus-visible:focus-ring"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva cita</span>
            </button>
          </div>
        }
      />

      <AgendaMetrics events={eventos} weekStart={weekStart} profesionales={profesionales as Profesional[]} />

      <div className="md:hidden">
        <AgendaSearch
          events={eventos}
          onEventSelect={handleEventClick}
          onDateSelect={(date) => {
            setCurrentDate(date);
            setVista('dia');
          }}
        />
      </div>

      <div className="panel-block p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="flex items-center gap-2 md:col-span-2">
            <button
              onClick={handleToday}
              className="rounded-pill border border-border bg-card px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
            >
              Hoy
            </button>
            <button
              onClick={handlePrev}
              className="rounded-full border border-border bg-card p-2 text-text hover:bg-cardHover focus-visible:focus-ring"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-semibold capitalize text-text">{dateLabel}</span>
            </div>
            <button
              onClick={handleNext}
              className="rounded-full border border-border bg-card p-2 text-text hover:bg-cardHover focus-visible:focus-ring"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-40">
            <details className="group">
              <summary className="flex w-full list-none items-center justify-between panel-block px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover">
                <span className="text-text">
                  {selectedProfesionales.length === 0
                    ? 'Todos los profesionales'
                    : `${selectedProfesionales.length} seleccionado${
                        selectedProfesionales.length > 1 ? 's' : ''
                      }`}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto panel-block shadow-lg">
                <div className="space-y-1 p-2">
                  <label className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-text transition-colors hover:bg-cardHover cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProfesionales.length === 0}
                      onChange={() => setSelectedProfesionales([])}
                      className="h-4 w-4 rounded border-border text-brand focus-visible:ring-2 focus-visible:ring-brand/50"
                    />
                    <span>Todos</span>
                  </label>
                  {profesionales.map((prof) => (
                    <label
                      key={prof.id}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-text transition-colors hover:bg-cardHover cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfesionales.includes(prof.id)}
                        onChange={(e) => {
                          setSelectedProfesionales((prev) =>
                            e.target.checked
                              ? [...prev, prof.id]
                              : prev.filter((id) => id !== prof.id)
                          );
                        }}
                        className="h-4 w-4 rounded border-border text-brand focus-visible:ring-2 focus-visible:ring-brand/50"
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

          <div>
            <select
              value={selectedSala}
              onChange={(e) => setSelectedSala(e.target.value)}
              className="w-full panel-block px-3 py-2 text-sm text-text focus-visible:focus-ring"
            >
              <option value="todas">Todas las salas</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Estado
            </p>
            <div className="flex flex-wrap gap-2">
              {ESTADO_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setEstadoFilter(filter.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:focus-ring ${
                    estadoFilter === filter.id
                      ? filter.className
                      : 'border border-border text-text-muted hover:bg-cardHover'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Tipo de cita
            </p>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as AgendaEvent['tipo'] | 'todos')}
              className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-text focus-visible:focus-ring"
            >
              {TIPO_FILTERS.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {vista === 'recursos' && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Preset de recursos
              </p>
              <select
                value={resourcePreset}
                onChange={(e) =>
                  setResourcePreset(e.target.value as 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria')
                }
                className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-text focus-visible:focus-ring"
              >
                {RECURSO_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-center panel-blockHover px-3 py-2 text-sm font-medium text-text-muted">
            {eventosFiltrados.length} eventos
          </div>
        </div>
      </div>

      <ViewSelector
        views={[
          { id: 'dia', label: 'Día', icon: <Calendar className="w-4 h-4" /> },
          { id: 'semana', label: 'Semana', icon: <List className="w-4 h-4" /> },
          { id: 'recursos', label: 'Recursos', icon: <UsersIcon className="w-4 h-4" /> },
        ]}
        currentView={vista}
        onViewChange={(v) => setVista(v as VistaAgenda)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <details className="group mb-4 lg:hidden" open>
            <summary className="flex cursor-pointer items-center justify-between panel-block px-3 py-2 text-sm font-medium text-text shadow-sm">
              <span>📅 Calendario</span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-2">
              <MiniCalendar
                currentDate={currentDate}
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  setVista('dia');
                }}
                onMonthChange={setCurrentDate}
                events={eventosFiltrados}
              />
            </div>
          </details>
          <div className="hidden lg:block">
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={(date) => {
                setCurrentDate(date);
                setVista('dia');
              }}
              onMonthChange={setCurrentDate}
              events={eventosFiltrados}
            />
          </div>
        </div>

        <div className="lg:col-span-9">
          <div
            className="panel-block shadow-sm"
            style={{ height: 'calc(100vh - 350px)', minHeight: '400px' }}
          >
            {vista === 'dia' && (
              <AgendaDayView
                day={currentDate}
                events={eventosFiltrados}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onEventClick={handleEventClick}
                onQuickAction={handleQuickAction}
                onCreateEvent={handleCreateEvent}
              />
            )}

            {vista === 'semana' && (
              <AgendaWeekViewV2
                weekStart={weekStart}
                events={eventosFiltrados}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onEventClick={handleEventClick}
                onQuickAction={handleQuickAction}
              />
            )}

            {vista === 'recursos' && (
              <AgendaResourceView
                day={currentDate}
                events={eventosFiltrados}
                resources={recursos}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onEventClick={handleEventClick}
                onQuickAction={handleQuickAction}
              />
            )}
          </div>
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
          setModalInitialDate(undefined);
        }}
        onSave={handleSaveEvent}
        event={eventToEdit}
        initialDate={modalInitialDate}
        profesionales={profesionales}
        salas={salas}
        pacientes={pacienteOptions as Array<{ id: string; nombre: string; apellidos: string }>}
      />

      <AgendaEventDrawer
        isOpen={isDrawerOpen && Boolean(drawerEvent)}
        event={drawerEvent}
        paciente={drawerPaciente ?? null}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerEvent(null);
        }}
        onEdit={handleEditFromDrawer}
        onAction={handleQuickAction}
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
