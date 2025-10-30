'use client';

import { useState, useMemo, useCallback } from 'react';
import { addDays, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { EstadoEventoAgenda } from '@/types';
import { Calendar, Clock, Users } from 'lucide-react';

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

interface AgendaTimelineProps {
  currentDate: Date;
  events: AgendaEvent[];
  onEventClick?: (event: AgendaEvent) => void;
  onEventDrop?: (event: AgendaEvent, newStart: Date, newEnd: Date) => void;
  onEventResize?: (event: AgendaEvent, newStart: Date, newEnd: Date) => void;
  onSlotClick?: (date: Date) => void;
  selectedProfesional?: string;
  selectedSala?: string;
}

const ESTADO_COLORS = {
  programada: '#3b82f6', // blue
  confirmada: '#10b981', // green
  realizada: '#6b7280', // gray
  cancelada: '#ef4444', // red
};

const TIPO_COLORS = {
  'primera-vez': '#3b82f6',
  'seguimiento': '#10b981',
  'revision': '#f59e0b',
  'tratamiento': '#8b5cf6',
  'urgencia': '#ef4444',
  'administrativo': '#6b7280',
};

const PRIORIDAD_BORDER = {
  alta: '4px solid #ef4444',
  media: '4px solid #f59e0b',
  baja: '4px solid #10b981',
};

export default function AgendaTimeline({
  currentDate,
  events,
  onEventClick,
  onEventDrop,
  onEventResize,
  onSlotClick,
  selectedProfesional,
  selectedSala
}: AgendaTimelineProps) {
  // Convertir eventos al formato FullCalendar
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.titulo || 'Sin título',
      start: event.fechaInicio,
      end: event.fechaFin,
      backgroundColor: ESTADO_COLORS[event.estado] || ESTADO_COLORS.programada,
      borderColor: event.prioridad ? PRIORIDAD_BORDER[event.prioridad].split(' ')[2] : 'transparent',
      borderWidth: event.prioridad === 'alta' ? 3 : 1,
      textColor: '#ffffff',
      extendedProps: {
        ...event,
        tipoColor: event.tipo ? TIPO_COLORS[event.tipo as keyof typeof TIPO_COLORS] : undefined,
      },
    }));
  }, [events]);

  // Manejar click en evento
  const handleEventClick = useCallback((clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
  }, [events, onEventClick]);

  // Manejar drag & drop
  const handleEventDrop = useCallback((dropInfo: any) => {
    const event = events.find(e => e.id === dropInfo.event.id);
    if (event && onEventDrop) {
      onEventDrop(event, dropInfo.event.start, dropInfo.event.end);
    }
  }, [events, onEventDrop]);

  // Manejar resize
  const handleEventResize = useCallback((resizeInfo: any) => {
    const event = events.find(e => e.id === resizeInfo.event.id);
    if (event && onEventResize) {
      onEventResize(event, resizeInfo.event.start, resizeInfo.event.end);
    }
  }, [events, onEventResize]);

  // Manejar click en slot vacío
  const handleDateClick = useCallback((dateClickInfo: any) => {
    if (onSlotClick) {
      onSlotClick(dateClickInfo.date);
    }
  }, [onSlotClick]);

  // Renderizar contenido del evento
  const renderEventContent = useCallback((eventInfo: any) => {
    const { extendedProps } = eventInfo.event;
    
    return (
      <div className="p-1 text-xs overflow-hidden">
        <div className="font-semibold truncate">{eventInfo.event.title}</div>
        <div className="text-white text-opacity-90 text-[10px] space-y-0.5 mt-0.5">
          {extendedProps.pacienteNombre && (
            <div className="truncate flex items-center gap-1">
              <Users className="w-3 h-3 flex-shrink-0" />
              {extendedProps.pacienteNombre}
            </div>
          )}
          {extendedProps.profesionalNombre && (
            <div className="truncate">{extendedProps.profesionalNombre}</div>
          )}
          {extendedProps.salaNombre && (
            <div className="truncate">{extendedProps.salaNombre}</div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {format(eventInfo.event.start, 'HH:mm')} - {format(eventInfo.event.end, 'HH:mm')}
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden agenda-timeline">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={currentDate}
        locale={esLocale}
        headerToolbar={false} // Lo manejamos nosotros
        events={calendarEvents}
        editable={true} // Permite drag & drop
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        allDaySlot={false}
        height="auto"
        contentHeight={600}
        expandRows={true}
        nowIndicator={true} // Línea roja "ahora"
        scrollTime="08:00:00"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        dayHeaderFormat={{
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        }}
        // Event handlers
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        // Configuración de interacción
        eventDurationEditable={true}
        eventStartEditable={true}
        eventResizableFromStart={true}
        // Estilos personalizados
        eventClassNames={(arg) => {
          const classes = ['cursor-pointer', 'hover:opacity-80', 'transition-opacity'];
          if (arg.event.extendedProps.prioridad === 'alta') {
            classes.push('border-l-4', 'border-l-red-500');
          }
          return classes;
        }}
      />

      <style jsx global>{`
        .agenda-timeline .fc {
          font-family: inherit;
        }

        .agenda-timeline .fc-theme-standard td,
        .agenda-timeline .fc-theme-standard th {
          border-color: #e5e7eb;
        }

        .agenda-timeline .fc-col-header-cell {
          padding: 12px 4px;
          background: #f9fafb;
          font-weight: 600;
          text-transform: capitalize;
        }

        .agenda-timeline .fc-timegrid-slot {
          height: 3em;
        }

        .agenda-timeline .fc-timegrid-slot-label {
          border-color: #e5e7eb;
          color: #6b7280;
          font-size: 0.75rem;
        }

        .agenda-timeline .fc-event {
          border-radius: 4px;
          border: none;
          padding: 0;
          overflow: hidden;
        }

        .agenda-timeline .fc-event-main {
          padding: 0;
        }

        .agenda-timeline .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
        }

        .agenda-timeline .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-width: 5px;
        }

        .agenda-timeline .fc-button {
          background: #3b82f6;
          border: none;
          text-transform: none;
          padding: 8px 16px;
        }

        .agenda-timeline .fc-button:hover {
          background: #2563eb;
        }

        .agenda-timeline .fc-button:focus {
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .agenda-timeline .fc-highlight {
          background: #dbeafe !important;
        }

        /* Mejorar legibilidad de horas */
        .agenda-timeline .fc-timegrid-axis {
          width: 60px !important;
        }

        /* Conflictos visuales */
        .agenda-timeline .fc-timegrid-event-harness {
          opacity: 0.95;
        }

        .agenda-timeline .fc-timegrid-event-harness:hover {
          opacity: 1;
          z-index: 10 !important;
        }
      `}</style>
    </div>
  );
}
