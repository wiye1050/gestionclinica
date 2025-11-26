'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
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
import type { CatalogoServicio } from '@/types';

interface AgendaDayViewProps {
  day: Date;
  events: AgendaEvent[];
  catalogoServicios?: CatalogoServicio[];
  onEventMove?: (eventId: string, newStart: Date) => void;
  onEventResize?: (eventId: string, newDuration: number) => void;
  onEventClick?: (event: AgendaEvent) => void;
  onQuickAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => void;
  onCreateEvent?: (start: Date) => void;
  onEdit?: (event: AgendaEvent) => void;
  onDelete?: (event: AgendaEvent) => void;
  hourHeight?: number;
}

export default function AgendaDayView({
  day,
  events,
  catalogoServicios = [],
  onEventMove,
  onEventResize,
  onEventClick,
  onQuickAction,
  onCreateEvent,
  onEdit,
  onDelete,
  hourHeight = AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR,
}: AgendaDayViewProps) {
  // Eventos del día
  const dayEvents = useMemo(() => getEventsForDay(events, day), [events, day]);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const pointerPositionRef = useRef({ x: 0, y: 0 });
  const hasPointerRef = useRef(false);

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

  const pointerMoveHandler = useCallback((event: PointerEvent) => {
    pointerPositionRef.current = { x: event.clientX, y: event.clientY };
    hasPointerRef.current = true;
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', pointerMoveHandler);
    };
  }, [pointerMoveHandler]);

  const computePointerDate = useCallback(() => {
    const container = timelineRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const relativeY = pointerPositionRef.current.y - rect.top;
    if (Number.isNaN(relativeY)) return null;
    const scrollTop = container.scrollTop;
    const totalHeight = hourHeight * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR);
    const absoluteY = Math.min(Math.max(scrollTop + relativeY, 0), totalHeight);
    const minutesFromStart = (absoluteY / hourHeight) * 60;
    const baseDate = new Date(day);
    baseDate.setHours(AGENDA_CONFIG.START_HOUR, 0, 0, 0);
    const newStart = new Date(baseDate.getTime() + minutesFromStart * 60000);
    return roundToNearestSlot(newStart);
  }, [day, hourHeight]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    window.removeEventListener('pointermove', pointerMoveHandler);
    setIsDragging(false);
    if (!result.destination || !onEventMove) return;

    const { draggableId } = result;
    const event = dayEvents.find((e) => e.id === draggableId);
    if (!event) return;

    let newStart = hasPointerRef.current ? computePointerDate() : null;

    if (!newStart) {
      const dropPosition = result.destination.index;
      const minutesFromStart = (dropPosition / hourHeight) * 60;
      const fallbackStart = new Date(day);
      fallbackStart.setHours(AGENDA_CONFIG.START_HOUR + Math.floor(minutesFromStart / 60));
      fallbackStart.setMinutes(minutesFromStart % 60);
      newStart = roundToNearestSlot(fallbackStart);
    }

    onEventMove(event.id, newStart);
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

  const handleDragStart = () => {
    hasPointerRef.current = false;
    pointerPositionRef.current = { x: 0, y: 0 };
    setIsDragging(true);
    window.addEventListener('pointermove', pointerMoveHandler);
  };

  const dayLabel = format(day, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="flex h-full flex-col">
      {/* Header con estadísticas */}
      <div className="rounded-t-lg border-b border-border bg-card px-2 py-2">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-text capitalize">{dayLabel}</h2>
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="rounded-full bg-brand-subtle px-2 py-1 font-medium text-brand">
              {stats.totalEvents} eventos
            </span>
            <span className="rounded-full bg-success-bg px-2 py-1 font-medium text-success">
              {stats.occupancy}% ocupación
            </span>
            {stats.conflicts > 0 && (
              <span className="rounded-full bg-danger-bg px-2 py-1 font-medium text-danger">
                {stats.conflicts} conflictos
              </span>
            )}
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-1 gap-1.5 text-[9px] text-text-muted sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span>Programadas: {dayEvents.filter(e => e.estado === 'programada').length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            <span>Confirmadas: {stats.confirmed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-muted" />
            <span>Realizadas: {stats.completed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-danger" />
            <span>Canceladas: {stats.cancelled}</span>
          </div>
        </div>
      </div>

      {/* Timeline con eventos */}
      <div className="relative flex-1">
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <AgendaTimeline
            showNowIndicator={true}
            onSlotClick={handleSlotClick}
            hourHeight={hourHeight}
            disableSlotClick={isDragging}
            onContainerRef={(node) => {
              timelineRef.current = node;
            }}
          >
            <Droppable droppableId="day-timeline" type="EVENT">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`absolute inset-0 ${snapshot.isDraggingOver ? 'bg-brand-subtle/60' : ''}`}
                >
                  {/* Eventos */}
                  {dayEvents.map((event, index) => {
                    const position = calculateEventPosition(event, hourHeight);
                    const hasConflict = conflictEventIds.has(event.id);

                    return (
                      <AgendaEventCard
                        key={event.id}
                        event={event}
                        index={index}
                        catalogoServicios={catalogoServicios}
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
        <div className="rounded-b-lg border-t border-border bg-card px-2 py-1.5 text-[9px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand" />
            <span>{stats.freeSlots} huecos libres disponibles</span>
          </div>
        </div>
      )}
    </div>
  );
}
