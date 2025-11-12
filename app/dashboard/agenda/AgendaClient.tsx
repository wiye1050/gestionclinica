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
import CompactFilters from '@/components/shared/CompactFilters';
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
import { Calendar, List, Users as UsersIcon, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { SerializedAgendaEvent } from '@/lib/server/agenda';
import type { Paciente } from '@/types';

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

  // Calcular KPIs
  const kpis = useMemo(() => {
    const total = eventosFiltrados.length;
    const programadas = eventosFiltrados.filter(e => e.estado === 'programada').length;
    const confirmadas = eventosFiltrados.filter(e => e.estado === 'confirmada').length;
    const canceladas = eventosFiltrados.filter(e => e.estado === 'cancelada').length;

    return { total, programadas, confirmadas, canceladas };
  }, [eventosFiltrados]);

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

  const activeFiltersCount = [
    selectedProfesionales.length > 0,
    selectedSala !== 'todas',
    estadoFilter !== 'todos',
    tipoFilter !== 'todos',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedProfesionales([]);
    setSelectedSala('todas');
    setEstadoFilter('todos');
    setTipoFilter('todos');
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header compacto con KPIs */}
      <div className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Agenda</h1>
              <p className="text-sm text-gray-500">Gestión de citas y recursos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden w-48 md:block">
              <AgendaSearch
                events={eventos}
                onEventSelect={handleEventClick}
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  setVista('dia');
                }}
              />
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

            <button
              onClick={() => {
                setModalInitialDate(new Date());
                setEventToEdit(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nueva cita
            </button>
          </div>
        </div>

        {/* KPIs integrados */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Programadas</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.programadas}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Confirmadas</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.confirmadas}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Canceladas</p>
              <p className="text-xl font-semibold text-gray-900">{kpis.canceladas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de fecha */}
      <div className="surface-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Hoy
            </button>
            <button
              onClick={handlePrev}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-[200px] text-center">
              <span className="text-base font-semibold capitalize text-gray-900">{dateLabel}</span>
            </div>
            <button
              onClick={handleNext}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <span className="text-sm text-gray-600">{eventosFiltrados.length} eventos</span>
        </div>
      </div>

      {/* Filtros compactos */}
      <CompactFilters
        filters={[
          {
            label: 'Sala',
            value: selectedSala,
            options: salas.map(s => ({ label: s.nombre, value: s.id })),
            onChange: setSelectedSala
          },
          {
            label: 'Tipo',
            value: tipoFilter,
            options: TIPO_FILTERS.filter(t => t.id !== 'todos').map(t => ({ label: t.label, value: t.id })),
            onChange: (v) => setTipoFilter(v as typeof tipoFilter)
          }
        ]}
        activeFiltersCount={activeFiltersCount}
        onClearAll={handleClearFilters}
      >
        {/* Estado buttons */}
        <div className="flex flex-wrap gap-2">
          {ESTADO_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setEstadoFilter(filter.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                estadoFilter === filter.id
                  ? filter.className
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Profesionales dropdown */}
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <span>
              {selectedProfesionales.length === 0
                ? 'Profesionales'
                : `${selectedProfesionales.length} seleccionado${selectedProfesionales.length > 1 ? 's' : ''}`}
            </span>
            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
          </summary>
          <div className="absolute right-0 z-50 mt-1 max-h-60 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="space-y-1 p-2">
              <label className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProfesionales.length === 0}
                  onChange={() => setSelectedProfesionales([])}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span>Todos</span>
              </label>
              {profesionales.map((prof) => (
                <label
                  key={prof.id}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
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
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span>
                    {prof.nombre} {prof.apellidos}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </details>
      </CompactFilters>

      <div className="md:hidden mb-4">
        <AgendaSearch
          events={eventos}
          onEventSelect={handleEventClick}
          onDateSelect={(date) => {
            setCurrentDate(date);
            setVista('dia');
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3">
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

        <div className="lg:col-span-9">
          <div
            className="surface-card shadow-sm"
            style={{ height: 'calc(100vh - 450px)', minHeight: '400px' }}
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
