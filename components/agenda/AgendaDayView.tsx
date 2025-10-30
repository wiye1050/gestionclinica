'use client';

import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { EstadoEventoAgenda } from '@/types';
import { Clock, User, MapPin, AlertCircle } from 'lucide-react';

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
  notas?: string;
}

interface AgendaDayViewProps {
  currentDate: Date;
  events: AgendaEvent[];
  onEventClick?: (event: AgendaEvent) => void;
  onEventDrop?: (event: AgendaEvent, newStart: Date, newEnd: Date) => void;
  onEventResize?: (event: AgendaEvent, newStart: Date, newEnd: Date) => void;
  onSlotClick?: (date: Date) => void;
  showList?: boolean;
}

const ESTADO_COLORS = {
  programada: '#3b82f6',
  confirmada: '#10b981',
  realizada: '#6b7280',
  cancelada: '#ef4444',
};

const ESTADO_LABELS = {
  programada: '📋 Programada',
  confirmada: '✅ Confirmada',
  realizada: '✔️ Realizada',
  cancelada: '❌ Cancelada',
};

export default function AgendaDayView({
  currentDate,
  events,
  onEventClick,
  onEventDrop,
  onEventResize,
  onSlotClick,
  showList = false
}: AgendaDayViewProps) {
  // Estadísticas del día
  const stats = useMemo(() => {
    const totalEventos = events.length;
    const confirmados = events.filter(e => e.estado === 'confirmada').length;
    const completados = events.filter(e => e.estado === 'realizada').length;
    const cancelados = events.filter(e => e.estado === 'cancelada').length;
    
    const totalMinutos = events.reduce((sum, e) => {
      if (e.estado !== 'cancelada') {
        return sum + (e.fechaFin.getTime() - e.fechaInicio.getTime()) / 60000;
      }
      return sum;
    }, 0);
    
    const ocupacion = Math.round((totalMinutos / (12 * 60)) * 100); // 12h laborables
    
    return {
      total: totalEventos,
      confirmados,
      completados,
      cancelados,
      ocupacion,
      pendientes: totalEventos - completados - cancelados,
    };
  }, [events]);

  // Convertir eventos al formato FullCalendar
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
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

  // Handlers
  const handleEventClick = useCallback((clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event && onEventClick) {
      onEventClick(event);
    }
  }, [events, onEventClick]);

  const handleEventDrop = useCallback((dropInfo: any) => {
    const event = events.find(e => e.id === dropInfo.event.id);
    if (event && onEventDrop) {
      onEventDrop(event, dropInfo.event.start, dropInfo.event.end);
    }
  }, [events, onEventDrop]);

  const handleEventResize = useCallback((resizeInfo: any) => {
    const event = events.find(e => e.id === resizeInfo.event.id);
    if (event && onEventResize) {
      onEventResize(event, resizeInfo.event.start, resizeInfo.event.end);
    }
  }, [events, onEventResize]);

  const handleDateClick = useCallback((dateClickInfo: any) => {
    if (onSlotClick) {
      onSlotClick(dateClickInfo.date);
    }
  }, [onSlotClick]);

  // Renderizar contenido del evento (vista timeline)
  const renderEventContent = useCallback((eventInfo: any) => {
    const { extendedProps } = eventInfo.event;
    
    return (
      <div className="p-2 text-xs overflow-hidden h-full flex flex-col">
        <div className="font-semibold truncate flex items-center justify-between">
          <span>{eventInfo.event.title}</span>
          {extendedProps.prioridad === 'alta' && (
            <AlertCircle className="w-3 h-3 text-red-200 flex-shrink-0" />
          )}
        </div>
        <div className="text-white text-opacity-90 text-[10px] space-y-1 mt-1 flex-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {format(eventInfo.event.start, 'HH:mm')} - {format(eventInfo.event.end, 'HH:mm')}
          </div>
          {extendedProps.pacienteNombre && (
            <div className="truncate flex items-center gap-1">
              <User className="w-3 h-3 flex-shrink-0" />
              {extendedProps.pacienteNombre}
            </div>
          )}
          {extendedProps.salaNombre && (
            <div className="truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {extendedProps.salaNombre}
            </div>
          )}
          {extendedProps.profesionalNombre && (
            <div className="truncate text-[9px]">
              👨‍⚕️ {extendedProps.profesionalNombre}
            </div>
          )}
        </div>
        <div className="text-[9px] text-white text-opacity-75 mt-auto pt-1 border-t border-white border-opacity-20">
          {ESTADO_LABELS[extendedProps.estado as EstadoEventoAgenda]}
        </div>
      </div>
    );
  }, []);

  return (
    <div className="space-y-4">
      {/* Stats del día */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-gray-500 uppercase font-medium">Total</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-blue-600 uppercase font-medium">Pendientes</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.pendientes}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-green-600 uppercase font-medium">Confirmados</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.confirmados}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-gray-600 uppercase font-medium">Completados</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.completados}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-red-600 uppercase font-medium">Cancelados</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.cancelados}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-purple-600 uppercase font-medium">Ocupación</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{stats.ocupacion}%</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow overflow-hidden agenda-day">
        <FullCalendar
          plugins={showList ? [listPlugin, interactionPlugin] : [timeGridPlugin, interactionPlugin]}
          initialView={showList ? 'listDay' : 'timeGridDay'}
          initialDate={currentDate}
          locale={esLocale}
          headerToolbar={false}
          events={calendarEvents}
          editable={!showList}
          selectable={!showList}
          selectMirror={true}
          dayMaxEvents={false}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00"
          allDaySlot={false}
          height="auto"
          contentHeight={700}
          nowIndicator={true}
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
          // Event handlers
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          dateClick={handleDateClick}
          eventContent={!showList ? renderEventContent : undefined}
          // Configuración de interacción
          eventDurationEditable={!showList}
          eventStartEditable={!showList}
          eventResizableFromStart={true}
        />

        <style jsx global>{`
          .agenda-day .fc {
            font-family: inherit;
          }

          .agenda-day .fc-theme-standard td,
          .agenda-day .fc-theme-standard th {
            border-color: #e5e7eb;
          }

          .agenda-day .fc-timegrid-slot {
            height: 2.5em;
          }

          .agenda-day .fc-timegrid-slot-label {
            border-color: #e5e7eb;
            color: #6b7280;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .agenda-day .fc-event {
            border-radius: 6px;
            border: none;
            padding: 0;
            overflow: hidden;
          }

          .agenda-day .fc-event-main {
            padding: 0;
          }

          .agenda-day .fc-timegrid-now-indicator-line {
            border-color: #ef4444;
            border-width: 2px;
          }

          .agenda-day .fc-timegrid-now-indicator-arrow {
            border-color: #ef4444;
            border-width: 6px;
          }

          .agenda-day .fc-highlight {
            background: #dbeafe !important;
          }

          /* Vista lista */
          .agenda-day .fc-list-event {
            cursor: pointer;
          }

          .agenda-day .fc-list-event:hover {
            background: #f3f4f6;
          }

          .agenda-day .fc-list-event-time {
            font-weight: 600;
          }
        `}</style>
      </div>
    </div>
  );
}
