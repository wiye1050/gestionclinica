'use client';

import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { EstadoEventoAgenda } from '@/types';
import { Clock, AlertCircle } from 'lucide-react';

interface AgendaEvent {
  id: string;
  titulo: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoEventoAgenda;
  tipo: string;
  pacienteId?: string;
  pacienteNombre?: string;
  profesionalId?: string;
  profesionalNombre?: string;
  salaId?: string;
  salaNombre?: string;
  prioridad?: 'alta' | 'media' | 'baja';
}

interface Profesional {
  id: string;
  nombre: string;
  apellidos: string;
  especialidad?: string;
}

interface AgendaRecursosProps {
  currentDate: Date;
  events: AgendaEvent[];
  profesionales: Profesional[];
  onEventClick?: (event: AgendaEvent) => void;
  onEventDrop?: (event: AgendaEvent, newStart: Date, newEnd: Date, newProfesional?: string) => void;
  onSlotClick?: (date: Date, profesionalId: string) => void;
}

const ESTADO_COLORS = {
  programada: '#3b82f6',
  confirmada: '#10b981',
  realizada: '#6b7280',
  cancelada: '#ef4444',
};

export default function AgendaRecursos({
  currentDate,
  events,
  profesionales,
  onEventClick,
  onEventDrop,
  onSlotClick
}: AgendaRecursosProps) {
  // Convertir profesionales a recursos
  const resources = useMemo(() => {
    return profesionales.map(prof => ({
      id: prof.id,
      title: `${prof.nombre} ${prof.apellidos}`,
      extendedProps: {
        especialidad: prof.especialidad,
      },
    }));
  }, [profesionales]);

  // Convertir eventos al formato FullCalendar
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      resourceId: event.profesionalId,
      title: event.titulo || 'Sin título',
      start: event.fechaInicio,
      end: event.fechaFin,
      backgroundColor: ESTADO_COLORS[event.estado] || ESTADO_COLORS.programada,
      borderColor: event.prioridad === 'alta' ? '#ef4444' : 'transparent',
      borderWidth: event.prioridad === 'alta' ? 3 : 1,
      textColor: '#ffffff',
      extendedProps: event,
    }));
  }, [events]);

  // Calcular estadísticas por profesional
  const estadisticasPorProfesional = useMemo(() => {
    const stats: Record<string, { total: number; ocupacion: number }> = {};
    
    profesionales.forEach(prof => {
      const eventosProfesional = events.filter(e => e.profesionalId === prof.id);
      const totalMinutos = eventosProfesional.reduce((sum, e) => {
        return sum + (e.fechaFin.getTime() - e.fechaInicio.getTime()) / 60000;
      }, 0);
      
      stats[prof.id] = {
        total: eventosProfesional.length,
        ocupacion: Math.round((totalMinutos / (8 * 60)) * 100) // Asumiendo jornada de 8h
      };
    });
    
    return stats;
  }, [profesionales, events]);

  // Manejar click en evento
  const handleEventClick = useCallback((clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
  }, [events, onEventClick]);

  // Manejar drag & drop entre recursos
  const handleEventDrop = useCallback((dropInfo: any) => {
    const event = events.find(e => e.id === dropInfo.event.id);
    const newProfesionalId = dropInfo.event.getResources()[0]?.id;
    
    if (event && onEventDrop) {
      onEventDrop(
        event,
        dropInfo.event.start,
        dropInfo.event.end,
        newProfesionalId
      );
    }
  }, [events, onEventDrop]);

  // Manejar click en slot vacío
  const handleDateClick = useCallback((dateClickInfo: any) => {
    if (onSlotClick && dateClickInfo.resource) {
      onSlotClick(dateClickInfo.date, dateClickInfo.resource.id);
    }
  }, [onSlotClick]);

  // Renderizar columna de recursos
  const renderResourceLane = useCallback((resourceInfo: any) => {
    const stats = estadisticasPorProfesional[resourceInfo.resource.id];
    
    return (
      <div className="p-2">
        <div className="font-semibold text-sm text-gray-900">
          {resourceInfo.resource.title}
        </div>
        {resourceInfo.resource.extendedProps.especialidad && (
          <div className="text-xs text-gray-500 capitalize">
            {resourceInfo.resource.extendedProps.especialidad}
          </div>
        )}
        {stats && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-600">
              {stats.total} citas
            </span>
            <span className={`text-xs font-medium ${
              stats.ocupacion > 80 ? 'text-red-600' :
              stats.ocupacion > 60 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {stats.ocupacion}%
            </span>
          </div>
        )}
      </div>
    );
  }, [estadisticasPorProfesional]);

  // Renderizar contenido del evento
  const renderEventContent = useCallback((eventInfo: any) => {
    const { extendedProps } = eventInfo.event;
    
    return (
      <div className="px-2 py-1 text-xs overflow-hidden h-full flex flex-col justify-center">
        <div className="font-semibold truncate">{eventInfo.event.title}</div>
        <div className="text-white text-opacity-90 text-[10px] space-y-0.5">
          {extendedProps.pacienteNombre && (
            <div className="truncate">{extendedProps.pacienteNombre}</div>
          )}
          {extendedProps.salaNombre && (
            <div className="truncate">📍 {extendedProps.salaNombre}</div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {format(eventInfo.event.start, 'HH:mm')} - {format(eventInfo.event.end, 'HH:mm')}
          </div>
        </div>
      </div>
    );
  }, []);

  // Detectar conflictos
  const hasConflict = useCallback((event: any) => {
    const eventStart = event.start.getTime();
    const eventEnd = event.end.getTime();
    const resourceId = event.getResources()[0]?.id;
    
    return calendarEvents.some(other => {
      if (other.id === event.id) return false;
      if (other.resourceId !== resourceId) return false;
      
      const otherStart = new Date(other.start).getTime();
      const otherEnd = new Date(other.end).getTime();
      
      return (eventStart < otherEnd && eventEnd > otherStart);
    });
  }, [calendarEvents]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden agenda-recursos">
      <FullCalendar
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineDay"
        initialDate={currentDate}
        locale={esLocale}
        headerToolbar={false}
        resources={resources}
        events={calendarEvents}
        editable={true}
        selectable={true}
        selectMirror={true}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:30:00"
        height="auto"
        contentHeight={400}
        nowIndicator={true}
        resourceAreaWidth="200px"
        resourceAreaHeaderContent="Profesionales"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        // Event handlers
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        resourceLabelContent={renderResourceLane}
        // Configuración de interacción
        eventDurationEditable={true}
        eventStartEditable={true}
        eventResourceEditable={true} // Permite mover entre profesionales
        // Estilos
        eventClassNames={(arg) => {
          const classes = ['cursor-pointer', 'hover:opacity-80', 'transition-opacity'];
          if (hasConflict(arg.event)) {
            classes.push('ring-2', 'ring-red-500', 'ring-opacity-50');
          }
          return classes;
        }}
      />

      <style jsx global>{`
        .agenda-recursos .fc {
          font-family: inherit;
        }

        .agenda-recursos .fc-theme-standard td,
        .agenda-recursos .fc-theme-standard th {
          border-color: #e5e7eb;
        }

        .agenda-recursos .fc-resource-timeline .fc-resource-group {
          background: #f9fafb;
        }

        .agenda-recursos .fc-timeline-slot {
          height: 4em;
        }

        .agenda-recursos .fc-timeline-slot-label {
          color: #6b7280;
          font-size: 0.75rem;
        }

        .agenda-recursos .fc-event {
          border-radius: 4px;
          border: none;
          padding: 0;
          min-height: 100%;
        }

        .agenda-recursos .fc-timeline-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
        }

        .agenda-recursos .fc-timeline-now-indicator-arrow {
          border-color: #ef4444;
        }

        .agenda-recursos .fc-highlight {
          background: #dbeafe !important;
        }

        /* Mejorar visibilidad de recursos */
        .agenda-recursos .fc-datagrid-cell-frame {
          padding: 0;
        }

        .agenda-recursos .fc-datagrid-cell-cushion {
          padding: 0;
        }

        /* Conflictos */
        .agenda-recursos .fc-event.ring-2 {
          position: relative;
        }

        .agenda-recursos .fc-event.ring-2::after {
          content: '⚠️';
          position: absolute;
          top: 2px;
          right: 2px;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}
