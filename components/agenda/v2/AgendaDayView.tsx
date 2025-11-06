'use client';

import { useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AgendaTimeline from './AgendaTimeline';
import AgendaEventCard from './AgendaEventCard';
import {
  AgendaEvent,
  AGENDA_CONFIG,
  calculateEventPosition,
  detectConflicts,
  getEventsForDay,
  roundToNearestSlot,
  calculateFreeSlots,
  calculateOccupancyRate,
} from './agendaHelpers';
import { Clock } from 'lucide-react';

interface AgendaDayViewProps {
  day: Date;
  events: AgendaEvent[];
  onEventMove?: (eventId: string, newStart: Date) => void;
  onEventResize?: (eventId: string, newDuration: number) => void;
  onEventClick?: (event: AgendaEvent) => void;
  onQuickAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => void;
  onCreateEvent?: (start: Date) => void;
  onEdit?: (event: AgendaEvent) => void;
  onDelete?: (event: AgendaEvent) => void;
}

export default function AgendaDayView({
  day,
  events,
  onEventMove,
  onEventResize,
  onEventClick,
  onQuickAction,
  onCreateEvent,
  onEdit,
  onDelete,
}: AgendaDayViewProps) {
  // Eventos del día
  const dayEvents = useMemo(() => getEventsForDay(events, day), [events, day]);

  // Detectar conflictos
  const conflicts = useMemo(() => detectConflicts(dayEvents), [dayEvents]);
  const conflictEventIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach(c => {
      ids.add(c.eventId1);
      ids.add(c.eventId2);
    });
    return ids;
  }, [conflicts]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const freeSlots = calculateFreeSlots(dayEvents, day);
    const occupancy = calculateOccupancyRate(dayEvents, day);
    
    return {
      totalEvents: dayEvents.length,
      confirmed: dayEvents.filter(e => e.estado === 'confirmada').length,
      completed: dayEvents.filter(e => e.estado === 'realizada').length,
      cancelled: dayEvents.filter(e => e.estado === 'cancelada').length,
      freeSlots: freeSlots.length,
      occupancy,
      conflicts: conflicts.length,
    };
  }, [dayEvents, day, conflicts]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onEventMove) return;

    const { draggableId } = result;
    const event = dayEvents.find(e => e.id === draggableId);
    if (!event) return;

    // Calcular nueva hora basada en la posición
    const dropPosition = result.destination.index;
    const minutesFromStart = (dropPosition / AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR) * 60;
    const newStart = new Date(day);
    newStart.setHours(AGENDA_CONFIG.START_HOUR + Math.floor(minutesFromStart / 60));
    newStart.setMinutes(minutesFromStart % 60);

    const roundedStart = roundToNearestSlot(newStart);
    onEventMove(event.id, roundedStart);
  };

  // Handle resize
  const handleResize = (eventId: string, newDurationMinutes: number) => {
    if (onEventResize) {
      onEventResize(eventId, newDurationMinutes);
    }
  };

  // Handle slot click para crear evento
  const handleSlotClick = (hour: number, minute: number) => {
    if (onCreateEvent) {
      const newStart = new Date(day);
      newStart.setHours(hour, minute, 0, 0);
      onCreateEvent(newStart);
    }
  };

  const dayLabel = format(day, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="flex h-full flex-col">
      {/* Header con estadísticas */}
      <div className="rounded-t-3xl border-b border-border bg-card px-6 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text capitalize">{dayLabel}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-pill bg-brand-subtle px-2 py-1 font-medium text-brand">
              {stats.totalEvents} eventos
            </span>
            <span className="rounded-pill bg-success-bg px-2 py-1 font-medium text-success">
              {stats.occupancy}% ocupación
            </span>
            {stats.conflicts > 0 && (
              <span className="rounded-pill bg-danger-bg px-2 py-1 font-medium text-danger">
                {stats.conflicts} conflictos
              </span>
            )}
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-1 gap-2 text-xs text-text-muted sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand" />
            <span>Programadas: {dayEvents.filter(e => e.estado === 'programada').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span>Confirmadas: {stats.confirmed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted" />
            <span>Realizadas: {stats.completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-danger" />
            <span>Canceladas: {stats.cancelled}</span>
          </div>
        </div>
      </div>

      {/* Timeline con eventos */}
      <div className="relative flex-1">
        <DragDropContext onDragEnd={handleDragEnd}>
          <AgendaTimeline showNowIndicator={true} onSlotClick={handleSlotClick}>
            <Droppable droppableId="day-timeline" type="EVENT">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`absolute inset-0 ${snapshot.isDraggingOver ? 'bg-brand-subtle/60' : ''}`}
                >
                  {/* Eventos */}
                  {dayEvents.map((event, index) => {
                    const position = calculateEventPosition(event);
                    const hasConflict = conflictEventIds.has(event.id);

                    return (
                      <AgendaEventCard
                        key={event.id}
                        event={event}
                        index={index}
                        style={{
                          top: `${position.top}px`,
                          height: `${position.height}px`,
                          left: '8px',
                          right: '8px',
                        }}
                        isResizable={true}
                        onResize={handleResize}
                        onClick={onEventClick}
                        onQuickAction={onQuickAction}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        hasConflict={hasConflict}
                      />
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </AgendaTimeline>
        </DragDropContext>
      </div>

      {/* Footer con huecos libres (opcional) */}
      {stats.freeSlots > 0 && (
        <div className="rounded-b-3xl border-t border-border bg-card px-4 py-2 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand" />
            <span>{stats.freeSlots} huecos libres disponibles</span>
          </div>
        </div>
      )}
    </div>
  );
}
