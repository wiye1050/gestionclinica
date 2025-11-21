'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { addDays, addWeeks, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEventosAgenda,
  useProfesionales,
  useSalas,
  usePacientes,
} from '@/lib/hooks/useQueries';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import CrossModuleAlert from '@/components/shared/CrossModuleAlert';
import AgendaDayView from '@/components/agenda/v2/AgendaDayView';
import AgendaWeekViewV2 from '@/components/agenda/v2/AgendaWeekViewV2';
import AgendaResourceView from '@/components/agenda/v2/AgendaResourceView';
import EventModal from '@/components/agenda/v2/EventModal';
import AgendaEventDrawer from '@/components/agenda/v2/AgendaEventDrawer';
import MiniCalendar from '@/components/agenda/v2/MiniCalendar';
import PrimaryTabs from '@/components/shared/PrimaryTabs';
import { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import {
  CalendarDays,
  List,
  LayoutGrid,
  Boxes,
  UserCircle,
  Plus,
  AlertTriangle,
  Lock,
  SunMedium,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { SerializedAgendaEvent } from '@/lib/server/agenda';
import type { Paciente } from '@/types';

export type VistaAgenda = 'diaria' | 'semanal' | 'multi' | 'boxes' | 'paciente';
type AgendaResource = { id: string; nombre: string; tipo: 'profesional' | 'sala' };

const AGENDA_STORAGE_KEY = 'agenda.filters.v1';
const VIEW_STORAGE_KEY = 'agenda.view.v1';
const DAY_MODE_STORAGE_KEY = 'agenda.dayMode.v1';

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

const VIEW_TABS: Array<{ id: VistaAgenda; label: string; helper: string; icon: ReactNode }> = [
  { id: 'diaria', label: 'Diaria', helper: 'Detalle por horas', icon: <CalendarDays className="h-4 w-4" /> },
  { id: 'semanal', label: 'Semanal', helper: 'Vista cronológica', icon: <List className="h-4 w-4" /> },
  { id: 'multi', label: 'Multi', helper: 'Columnas por profesional', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'boxes', label: 'Boxes', helper: 'Flujo por salas', icon: <Boxes className="h-4 w-4" /> },
  { id: 'paciente', label: 'Paciente', helper: 'Seguimiento individual', icon: <UserCircle className="h-4 w-4" /> },
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
  const prefetchedEvents = useMemo(() => deserializeEvents(initialEvents), [initialEvents]);
  const initialWeekStartDate = useMemo(() => new Date(initialWeekStart), [initialWeekStart]);

  const [vista, setVista] = useState<VistaAgenda>('multi');
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
  const [modalPrefill, setModalPrefill] =
    useState<{ pacienteId?: string; profesionalId?: string } | null>(null);
  const [viewDensity, setViewDensity] = useState<'comfort' | 'compact'>('comfort');
  const [prefillRequestKey, setPrefillRequestKey] = useState<string | null>(null);
  const [dayViewMode, setDayViewMode] = useState<'single' | 'multi'>('single');
  const hourHeight = viewDensity === 'compact' ? 60 : 90;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (
      storedView === 'diaria' ||
      storedView === 'semanal' ||
      storedView === 'multi' ||
      storedView === 'boxes' ||
      storedView === 'paciente'
    ) {
      setVista(storedView);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, vista);
  }, [vista]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedDayMode = window.localStorage.getItem(DAY_MODE_STORAGE_KEY);
    if (storedDayMode === 'single' || storedDayMode === 'multi') {
      setDayViewMode(storedDayMode);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DAY_MODE_STORAGE_KEY, dayViewMode);
  }, [dayViewMode]);

  useEffect(() => {
    if (!prefillRequest) return;
    if (prefillRequest.forcedView) {
      setVista(prefillRequest.forcedView);
    }
    if (prefillRequest.presetProfesionales && prefillRequest.presetProfesionales.length > 0) {
      setSelectedProfesionales(prefillRequest.presetProfesionales);
    }
  }, [prefillRequest]);
  useEffect(() => {
    if (!prefillRequest?.targetDate) return;
    const parsed = new Date(prefillRequest.targetDate);
    if (!Number.isNaN(parsed.getTime())) {
      setCurrentDate(parsed);
    }
  }, [prefillRequest?.targetDate]);
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

  const showUndoToast = useCallback(
    (message: string, undoAction: () => Promise<void>) => {
      toast.success(message, {
        action: {
          label: 'Deshacer',
          onClick: () => {
            undoAction()
              .then(() => {
                toast.success('Cambio revertido');
              })
              .catch((error) => {
                console.error('Error al deshacer cambio de agenda', error);
                toast.error('No se pudo deshacer el cambio');
              });
          },
        },
      });
    },
    []
  );

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
      const revertPayload: Record<string, unknown> = {
        fechaInicio: evento.fechaInicio.toISOString(),
        fechaFin: evento.fechaFin.toISOString(),
      };
      if (evento.profesionalId !== undefined) {
        revertPayload.profesionalId = evento.profesionalId || null;
      }
      showUndoToast('Evento actualizado', async () => {
        await requestAgenda(`/api/agenda/eventos/${eventId}`, {
          method: 'PATCH',
          body: JSON.stringify(revertPayload),
        });
        await invalidateAgenda();
      });
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
      showUndoToast('Duración actualizada', async () => {
        await requestAgenda(`/api/agenda/eventos/${eventId}`, {
          method: 'PATCH',
          body: JSON.stringify({ fechaFin: evento.fechaFin.toISOString() }),
        });
        await invalidateAgenda();
      });
    } catch (error) {
      console.error('Error al redimensionar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar duración');
    }
  };

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

  const handleReassignProfessional = async (evento: AgendaEvent, profesionalId: string) => {
    try {
      await requestAgenda(`/api/agenda/eventos/${evento.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ profesionalId: profesionalId || null }),
      });
      await invalidateAgenda();
      toast.success('Profesional actualizado');
    } catch (error) {
      console.error('Error al reasignar profesional', error);
      toast.error('No se pudo reasignar la cita');
    }
  };

  const handleInlineUpdate = async (eventId: string, updates: Partial<AgendaEvent>) => {
    try {
      const payload = serializeEventPayload(updates as EventPayload);
      await requestAgenda(`/api/agenda/eventos/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await invalidateAgenda();
      toast.success('Cita actualizada');
    } catch (error) {
      console.error('Error al actualizar cita', error);
      toast.error('No se pudo actualizar la cita');
    }
  };

  const handleQuickAction = async (
    evento: AgendaEvent,
    action: 'confirm' | 'complete' | 'cancel'
  ) => {
    try {
      const nuevoEstado =
        action === 'confirm' ? 'confirmada' : action === 'complete' ? 'realizada' : 'cancelada';
      const estadoAnterior = evento.estado;

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

      showUndoToast(mensajes[action], async () => {
        await requestAgenda(`/api/agenda/eventos/${evento.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ estado: estadoAnterior }),
        });
        await invalidateAgenda();
      });
    } catch (error) {
      console.error('Error en acción rápida:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    }
  };

  const openNewEventModal = useCallback(
    (initialDate?: Date, prefill?: { pacienteId?: string; profesionalId?: string }) => {
      setModalPrefill(prefill ?? null);
      setModalInitialDate(initialDate ?? new Date());
      setEventToEdit(null);
      setIsModalOpen(true);
    },
    []
  );

  const handleCreateEvent = async (start: Date) => {
    openNewEventModal(start);
  };

  useEffect(() => {
    if (!prefillRequest?.openModal) return;
    const key = `${prefillRequest.pacienteId ?? ''}-${prefillRequest.profesionalId ?? ''}`;
    if (prefillRequestKey === key) return;
    setPrefillRequestKey(key);
    openNewEventModal(new Date(), {
      pacienteId: prefillRequest.pacienteId ?? undefined,
      profesionalId: prefillRequest.profesionalId ?? undefined,
    });
  }, [prefillRequest, prefillRequestKey, openNewEventModal]);

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

      const eventoFechaInicio =
        eventData.fechaInicio instanceof Date ? eventData.fechaInicio : eventToEdit?.fechaInicio;
      const eventoProfesionalId =
        typeof eventData.profesionalId === 'string'
          ? eventData.profesionalId
          : eventToEdit?.profesionalId;

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
      focusAgendaOnEvent(eventoProfesionalId, eventoFechaInicio);
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
      <section className="rounded-[36px] border border-border bg-card/90 p-5 shadow-lg">
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-3xl border border-border bg-white px-3 py-2 shadow-sm">
                  <button
                    onClick={handlePrev}
                    className="rounded-full p-1 text-text hover:bg-cardHover focus-visible:focus-ring"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleToday}
                    className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-text hover:bg-cardHover focus-visible:focus-ring"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={handleNext}
                    className="rounded-full p-1 text-text hover:bg-cardHover focus-visible:focus-ring"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-3xl bg-card px-3 py-1 text-sm font-semibold capitalize text-text shadow-inner">
                  {dateLabel}
                </div>
                <span className="rounded-full border border-dashed border-border bg-card px-3 py-1 text-xs font-semibold text-text-muted">
                  {eventosFiltrados.length} eventos
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <details className="group" title="Profesionales visibles">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-xs font-semibold text-text shadow-sm transition-colors hover:bg-cardHover">
                      <span>
                        {selectedProfesionales.length === 0
                          ? 'Todos los profesionales'
                          : `${selectedProfesionales.length} seleccionado${
                              selectedProfesionales.length > 1 ? 's' : ''
                            }`}
                      </span>
                      <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="absolute left-0 z-50 mt-1 max-h-60 min-w-[240px] overflow-y-auto rounded-2xl border border-border bg-white shadow-2xl">
                      <div className="space-y-1 p-2 text-sm">
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-cardHover">
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
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-cardHover"
                          >
                            <input
                              type="checkbox"
                              checked={selectedProfesionales.includes(prof.id)}
                              onChange={(e) => {
                                setSelectedProfesionales((prev) =>
                                  e.target.checked ? [...prev, prof.id] : prev.filter((id) => id !== prof.id)
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

                <select
                  value={selectedSala}
                  onChange={(e) => setSelectedSala(e.target.value)}
                  className="rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-text focus-visible:focus-ring"
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
                  onChange={(e) => setTipoFilter(e.target.value as AgendaEvent['tipo'] | 'todos')}
                  className="rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-text focus-visible:focus-ring"
                >
                  {TIPO_FILTERS.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.label}
                    </option>
                  ))}
                </select>

                <select
                  value={resourcePreset}
                  disabled={vista !== 'multi'}
                  onChange={(e) =>
                    setResourcePreset(e.target.value as 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria')
                  }
                  className={`rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-text focus-visible:focus-ring ${
                    vista !== 'multi' ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {RECURSO_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {ESTADO_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setEstadoFilter(filter.id)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors focus-visible:focus-ring ${
                      estadoFilter === filter.id
                        ? `${filter.className} border border-transparent`
                        : 'border border-border text-text-muted hover:bg-cardHover'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
                <div className="inline-flex rounded-full border border-border bg-card p-1 text-[11px] font-semibold text-text-muted">
                  {[
                    { id: 'comfort', label: 'Amplia' },
                    { id: 'compact', label: 'Compacta' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setViewDensity(option.id as 'comfort' | 'compact')}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        viewDensity === option.id
                          ? 'bg-brand text-text'
                          : 'text-text-muted hover:bg-cardHover'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-full border border-border bg-card p-1 text-[11px] font-semibold text-text-muted">
                  {[
                    { id: 'single', label: 'Una columna' },
                    { id: 'multi', label: 'Multi-columna' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setDayViewMode(option.id as 'single' | 'multi')}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        dayViewMode === option.id
                          ? 'bg-brand text-text'
                          : 'text-text-muted hover:bg-cardHover'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openNewEventModal(new Date())}
                  className="inline-flex items-center gap-1 rounded-2xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-brand-700 hover:shadow-lg focus-visible:focus-ring"
                >
                  <Plus className="h-4 w-4" /> Nueva cita
                </button>
                <button
                  onClick={() => openNewEventModal(new Date())}
                  className="inline-flex items-center gap-1 rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Urgencia
                </button>
                <button
                  onClick={() => toast.info('La gestión de bloqueos estará disponible en la siguiente iteración.')}
                  className="inline-flex items-center gap-1 rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
                >
                  <Lock className="h-4 w-4" /> Bloqueos
                </button>
                <button
                  onClick={() => toast.info('La apertura rápida del día llegará pronto.')}
                  className="inline-flex items-center gap-1 rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-cardHover focus-visible:focus-ring"
                >
                  <SunMedium className="h-4 w-4 text-brand" /> Abrir día
                </button>
              </div>
            </div>
        </div>
      </section>

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

      <section className="rounded-[32px] border border-border bg-card shadow-lg p-3">
        <PrimaryTabs
          tabs={VIEW_TABS}
          current={vista}
          onChange={(tab) => setVista(tab)}
          size="sm"
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div
            className="rounded-[28px] border border-border bg-cardHover/30 p-2 sm:p-4"
            style={{ minHeight: '65vh' }}
          >
          {vista === 'diaria' &&
            (dayViewMode === 'single' ? (
              <AgendaDayView
                day={currentDate}
                events={eventosFiltrados}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onEventClick={handleEventClick}
                onQuickAction={handleQuickAction}
                onCreateEvent={handleCreateEvent}
                hourHeight={hourHeight}
              />
            ) : (
              <AgendaResourceView
                day={currentDate}
                events={eventosFiltrados}
                resources={recursos}
                onEventMove={handleEventMove}
                onEventResize={handleEventResize}
                onEventClick={handleEventClick}
                onQuickAction={handleQuickAction}
                hourHeight={hourHeight}
              />
            ))}

          {vista === 'semanal' && (
            <AgendaWeekViewV2
              weekStart={weekStart}
              events={eventosFiltrados}
              onEventMove={handleEventMove}
              onEventResize={handleEventResize}
              onEventClick={handleEventClick}
              onQuickAction={handleQuickAction}
              hourHeight={hourHeight}
            />
          )}

          {vista === 'multi' && (
            <AgendaResourceView
              day={currentDate}
              events={eventosFiltrados}
              resources={recursos}
              onEventMove={handleEventMove}
              onEventResize={handleEventResize}
              onEventClick={handleEventClick}
              onQuickAction={handleQuickAction}
              hourHeight={hourHeight}
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

          <aside className="flex flex-col gap-4 rounded-[28px] border border-border bg-cardHover/30 p-3">
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={(date) => {
                setCurrentDate(date);
                setVista('diaria');
              }}
              onMonthChange={setCurrentDate}
              events={eventosFiltrados}
            />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Semana
              </p>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const isActive = day.isSelected;
                  return (
                    <button
                      key={`${day.label}-${day.dayNumber}`}
                      onClick={() => setCurrentDate(day.date)}
                      className={`flex flex-col items-center rounded-2xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors focus-visible:focus-ring ${
                        isActive
                          ? 'border-brand bg-brand/20 text-text'
                          : 'border-border bg-card text-text-muted hover:bg-cardHover'
                      }`}
                    >
                      <span>{day.label}</span>
                      <span className="text-lg leading-none text-text">{day.dayNumber}</span>
                      {day.isToday && <span className="text-[9px] text-brand">hoy</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
          setModalInitialDate(undefined);
          setModalPrefill(null);
        }}
        onSave={handleSaveEvent}
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
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerEvent(null);
        }}
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
