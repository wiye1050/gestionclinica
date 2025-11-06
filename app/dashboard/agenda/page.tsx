'use client';

import { Suspense, useMemo, useState } from 'react';
import {
  addDays,
  addWeeks,
  startOfWeek,
  format
} from 'date-fns';
import { es } from 'date-fns/locale';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import {
  useEventosAgenda,
  useProfesionales,
  useSalas,
  usePacientes
} from '@/lib/hooks/useQueries';
import ModuleHeader from '@/components/shared/ModuleHeader';
import ViewSelector from '@/components/shared/ViewSelector';
import SkeletonLoader from '@/components/shared/SkeletonLoader';
import AgendaDayView from '@/components/agenda/v2/AgendaDayView';
import AgendaWeekViewV2 from '@/components/agenda/v2/AgendaWeekViewV2';
import AgendaResourceView from '@/components/agenda/v2/AgendaResourceView';
import EventModal from '@/components/agenda/v2/EventModal';
import MiniCalendar from '@/components/agenda/v2/MiniCalendar';
import AgendaSearch from '@/components/agenda/v2/AgendaSearch';
import { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import {
  Calendar,
  List,
  Users as UsersIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type VistaAgenda = 'dia' | 'semana' | 'recursos';
type AgendaResource = { id: string; nombre: string; tipo: 'profesional' | 'sala' };

function AgendaContent() {
  const [vista, setVista] = useState<VistaAgenda>('semana');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedProfesionales, setSelectedProfesionales] = useState<string[]>([]);
  const [selectedSala, setSelectedSala] = useState<string>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();
  const [eventToEdit, setEventToEdit] = useState<AgendaEvent | null>(null);

  const weekStart = useMemo(() => 
    startOfWeek(currentDate, { weekStartsOn: 1 }), 
    [currentDate]
  );

  // React Query hooks
  const { data: eventosData, isLoading: loadingEventos } = useEventosAgenda(weekStart);
  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionales();
  const { data: salas = [], isLoading: loadingSalas } = useSalas();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();

  const loading = loadingEventos || loadingProfesionales || loadingSalas || loadingPacientes;

  const eventos: AgendaEvent[] = useMemo(
    () => eventosData ?? [],
    [eventosData]
  );

  // Filtrar eventos
  const pacienteOptions = useMemo((): Array<{ id: string; nombre: string; apellidos: string }> => {
    return pacientes.map((paciente) => ({
      id: paciente.id,
      nombre: paciente.nombre ?? 'Sin nombre',
      apellidos: paciente.apellidos ?? ''
    }));
  }, [pacientes]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const matchProfesional =
        selectedProfesionales.length === 0 || selectedProfesionales.includes(evento.profesionalId || '');
      const matchSala = selectedSala === 'todas' || evento.salaId === selectedSala;
      return matchProfesional && matchSala;
    });
  }, [eventos, selectedProfesionales, selectedSala]);

  // Recursos para vista de recursos
  const recursos = useMemo<AgendaResource[]>(() => {
    const baseProfesionales =
      selectedProfesionales.length > 0
        ? selectedProfesionales
            .map((id) => profesionales.find((p) => p.id === id))
            .filter((prof): prof is typeof profesionales[number] => Boolean(prof))
        : profesionales.slice(0, 3);

    return baseProfesionales.map((prof) => ({
      id: prof.id,
      nombre: `${prof.nombre} ${prof.apellidos}`,
      tipo: 'profesional',
    }));
  }, [profesionales, selectedProfesionales]);

  // Navegación
  const handlePrev = () => {
    if (vista === 'dia') {
      setCurrentDate(prev => addDays(prev, -1));
    } else {
      setCurrentDate(prev => addWeeks(prev, -1));
    }
  };

  const handleNext = () => {
    if (vista === 'dia') {
      setCurrentDate(prev => addDays(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // CRUD de eventos
  const handleEventMove = async (eventId: string, newStart: Date, newResourceId?: string) => {
    try {
      const evento = eventos.find(e => e.id === eventId);
      if (!evento) return;

      const duration = evento.fechaFin.getTime() - evento.fechaInicio.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      const updateData: {
        fechaInicio: Timestamp;
        fechaFin: Timestamp;
        updatedAt: Timestamp;
        profesionalId?: string;
        profesionalNombre?: string;
      } = {
        fechaInicio: Timestamp.fromDate(newStart),
        fechaFin: Timestamp.fromDate(newEnd),
        updatedAt: Timestamp.now(),
      };

      if (newResourceId && newResourceId !== evento.profesionalId) {
        updateData.profesionalId = newResourceId;
        const prof = profesionales.find(p => p.id === newResourceId);
        if (prof) {
          updateData.profesionalNombre = `${prof.nombre} ${prof.apellidos}`;
        }
      }

      await updateDoc(doc(db, 'agenda-eventos', eventId), updateData);
      toast.success('Evento actualizado');
    } catch (error) {
      console.error('Error al mover evento:', error);
      toast.error('Error al actualizar el evento');
    }
  };

  const handleEventResize = async (eventId: string, newDurationMinutes: number) => {
    try {
      const evento = eventos.find(e => e.id === eventId);
      if (!evento) return;

      const newEnd = new Date(evento.fechaInicio.getTime() + newDurationMinutes * 60000);

      await updateDoc(doc(db, 'agenda-eventos', eventId), {
        fechaFin: Timestamp.fromDate(newEnd),
        updatedAt: Timestamp.now(),
      });

      toast.success('Duración actualizada');
    } catch (error) {
      console.error('Error al redimensionar:', error);
      toast.error('Error al actualizar duración');
    }
  };

  const handleQuickAction = async (
    evento: AgendaEvent, 
    action: 'confirm' | 'complete' | 'cancel'
  ) => {
    try {
      const nuevoEstado = 
        action === 'confirm' ? 'confirmada' :
        action === 'complete' ? 'realizada' : 'cancelada';

      await updateDoc(doc(db, 'agenda-eventos', evento.id), {
        estado: nuevoEstado,
        updatedAt: Timestamp.now(),
      });

      const mensajes = {
        confirm: 'Cita confirmada',
        complete: 'Cita completada',
        cancel: 'Cita cancelada',
      };

      toast.success(mensajes[action]);
    } catch (error) {
      console.error('Error en acción rápida:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleCreateEvent = async (start: Date) => {
    setModalInitialDate(start);
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (evento: AgendaEvent) => {
    setEventToEdit(evento);
    setModalInitialDate(undefined);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventData: Partial<AgendaEvent>) => {
    try {
      if (!eventData.fechaInicio || !eventData.fechaFin) {
        toast.error('Faltan datos de fecha para la cita');
        return;
      }

      if (eventToEdit) {
        // Actualizar evento existente
        await updateDoc(doc(db, 'agenda-eventos', eventToEdit.id), {
          ...eventData,
          fechaInicio: Timestamp.fromDate(eventData.fechaInicio!),
          fechaFin: Timestamp.fromDate(eventData.fechaFin!),
          updatedAt: Timestamp.now(),
        });
        toast.success('Cita actualizada');
      } else {
        // Crear nuevo evento
        await addDoc(collection(db, 'agenda-eventos'), {
          ...eventData,
          fechaInicio: Timestamp.fromDate(eventData.fechaInicio!),
          fechaFin: Timestamp.fromDate(eventData.fechaFin!),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        toast.success('Cita creada');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la cita');
      throw error;
    }
  };

  // Formato de fecha para navegación
  const dateLabel = useMemo(() => {
    if (vista === 'dia') {
      return format(currentDate, "d 'de' MMMM, yyyy", { locale: es });
    } else {
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;
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
            {/* Búsqueda - desktop */}
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
              className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:focus-ring"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva cita</span>
            </button>
          </div>
        }
      />

      {/* Búsqueda móvil */}
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

      {/* Filtros y Navegación */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {/* Navegación temporal */}
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
              <span className="text-sm font-semibold capitalize text-text">
                {dateLabel}
              </span>
            </div>
            <button
              onClick={handleNext}
              className="rounded-full border border-border bg-card p-2 text-text hover:bg-cardHover focus-visible:focus-ring"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filtro Profesional - Multi-select */}
          <div className="relative z-40">
            <details className="group">
              <summary className="flex w-full list-none items-center justify-between rounded-2xl border border-border bg-card px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-cardHover">
                <span className="text-text">
                  {selectedProfesionales.length === 0
                    ? 'Todos los profesionales'
                    : `${selectedProfesionales.length} seleccionado${selectedProfesionales.length > 1 ? 's' : ''}`}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-border bg-card shadow-lg">
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
                      <span>{prof.nombre} {prof.apellidos}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>
          </div>

          {/* Filtro Sala */}
          <div>
            <select
              value={selectedSala}
              onChange={(e) => setSelectedSala(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-text focus-visible:focus-ring"
            >
              <option value="todas">Todas las salas</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Contador */}
          <div className="flex items-center justify-center rounded-2xl border border-border bg-cardHover px-3 py-2 text-sm font-medium text-text-muted">
            {eventosFiltrados.length} eventos
          </div>
        </div>
      </div>

      {/* Selector de Vista */}
      <ViewSelector
        views={[
          { id: 'dia', label: 'Día', icon: <Calendar className="w-4 h-4" /> },
          { id: 'semana', label: 'Semana', icon: <List className="w-4 h-4" /> },
          { id: 'recursos', label: 'Recursos', icon: <UsersIcon className="w-4 h-4" /> },
        ]}
        currentView={vista}
        onViewChange={(v) => setVista(v as VistaAgenda)}
      />

      {/* Layout principal con MiniCalendar y vistas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Mini Calendario - Sidebar - Colapsable en móvil */}
        <div className="lg:col-span-3">
          <details className="group mb-4 lg:hidden" open>
            <summary className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card px-3 py-2 text-sm font-medium text-text shadow-sm">
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

        {/* Vista Seleccionada */}
        <div className="lg:col-span-9">
          <div
            className="rounded-3xl border border-border bg-card shadow-sm"
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

      {/* Modal de Nueva Cita */}
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
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <AgendaContent />
    </Suspense>
  );
}
