'use client';

import { Suspense, useMemo, useState } from 'react';
import { 
  addDays, 
  addWeeks, 
  startOfWeek, 
  startOfMonth,
  subWeeks,
  format 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
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
import { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import { 
  Calendar, 
  List, 
  Users as UsersIcon, 
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

type VistaAgenda = 'dia' | 'semana' | 'recursos';

function AgendaContent() {
  const { user } = useAuth();
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
  const { data: eventosData = [], isLoading: loadingEventos } = useEventosAgenda(weekStart);
  const { data: profesionales = [], isLoading: loadingProfesionales } = useProfesionales();
  const { data: salas = [], isLoading: loadingSalas } = useSalas();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();

  const loading = loadingEventos || loadingProfesionales || loadingSalas || loadingPacientes;

  // Convertir eventos al formato de la nueva agenda
  const eventos: AgendaEvent[] = useMemo(() => {
    return eventosData.map((e: any) => ({
      id: e.id,
      titulo: e.titulo || 'Sin título',
      fechaInicio: e.fechaInicio instanceof Date ? e.fechaInicio : e.fechaInicio.toDate(),
      fechaFin: e.fechaFin instanceof Date ? e.fechaFin : e.fechaFin.toDate(),
      estado: e.estado || 'programada',
      tipo: e.tipo || 'consulta',
      pacienteId: e.pacienteId,
      pacienteNombre: e.pacienteNombre,
      profesionalId: e.profesionalId,
      profesionalNombre: e.profesionalNombre,
      salaId: e.salaId,
      salaNombre: e.salaNombre,
      prioridad: e.prioridad || 'media',
      notas: e.notas,
    }));
  }, [eventosData]);

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const matchProfesional =
        selectedProfesionales.length === 0 || selectedProfesionales.includes(evento.profesionalId || '');
      const matchSala = selectedSala === 'todas' || evento.salaId === selectedSala;
      return matchProfesional && matchSala;
    });
  }, [eventos, selectedProfesionales, selectedSala]);

  // Recursos para vista de recursos
  const recursos = useMemo(() => {
    if (selectedProfesionales.length > 0) {
      return selectedProfesionales
        .map(id => profesionales.find(p => p.id === id))
        .filter(Boolean)
        .map(p => ({
          id: p!.id,
          nombre: `${p!.nombre} ${p!.apellidos}`,
          tipo: 'profesional' as const,
        }));
    }
    return profesionales.slice(0, 3).map(p => ({
      id: p.id,
      nombre: `${p.nombre} ${p.apellidos}`,
      tipo: 'profesional' as const,
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

      const updateData: any = {
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
        actions={
          <button
            onClick={() => {
              setModalInitialDate(new Date());
              setEventToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        }
      />

      {/* Filtros y Navegación */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Navegación temporal */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hoy
            </button>
            <button
              onClick={handlePrev}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-semibold text-gray-900 capitalize">
                {dateLabel}
              </span>
            </div>
            <button
              onClick={handleNext}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filtro Profesional - Multi-select */}
          <div className="relative">
            <details className="group">
              <summary className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                <span className="text-gray-900">
                  {selectedProfesionales.length === 0
                    ? 'Todos los profesionales'
                    : `${selectedProfesionales.length} seleccionado${selectedProfesionales.length > 1 ? 's' : ''}`}
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 space-y-1">
                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProfesionales.length === 0}
                      onChange={() => setSelectedProfesionales([])}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">Todos</span>
                  </label>
                  {profesionales.map((prof) => (
                    <label key={prof.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProfesionales.includes(prof.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProfesionales([...selectedProfesionales, prof.id]);
                          } else {
                            setSelectedProfesionales(selectedProfesionales.filter(id => id !== prof.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{prof.nombre} {prof.apellidos}</span>
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
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todas">Todas las salas</option>
              {salas.map((sala: any) => (
                <option key={sala.id} value={sala.id}>
                  {sala.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Contador */}
          <div className="flex items-center justify-center text-sm text-gray-600 font-medium">
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

      {/* Vista Seleccionada */}
      <div className="bg-white rounded-lg shadow" style={{ height: 'calc(100vh - 500px)' }}>
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
            onCreateEvent={handleCreateEvent}
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
            onCreateEvent={handleCreateEvent}
          />
        )}
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
        pacientes={pacientes}
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
