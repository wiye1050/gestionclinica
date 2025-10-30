'use client';

import { useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import AgendaTimeline from './AgendaTimeline';
import AgendaEventCard from './AgendaEventCard';
import {
  AgendaEvent,
  AGENDA_CONFIG,
  calculateEventPosition,
  detectConflicts,
  roundToNearestSlot,
  getEventsForDay,
  calculateOccupancyRate,
} from './agendaHelpers';

interface AgendaWeekViewV2Props {
  weekStart: Date;
  events: AgendaEvent[];
  onEventMove?: (eventId: string, newStart: Date) => void;
  onEventResize?: (eventId: string, newDuration: number) => void;
  onEventClick?: (event: AgendaEvent) => void;
  onQuickAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => void;
  onCreateEvent?: (start: Date) => void;
  onEdit?: (event: AgendaEvent) => void;
  onDelete?: (event: AgendaEvent) => void;
}

export default function AgendaWeekViewV2({
  weekStart,
  events,
  onEventMove,
  onEventResize,
  onEventClick,
  onQuickAction,
  onCreateEvent,
  onEdit,
  onDelete,
}: AgendaWeekViewV2Props) {
  // Días de la semana
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Eventos por día
  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, AgendaEvent[]>();
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped.set(dayKey, getEventsForDay(events, day));
    });
    return grouped;
  }, [weekDays, events]);

  // Detectar conflictos
  const conflicts = useMemo(() => detectConflicts(events), [events]);
  const conflictEventIds = useMemo(() => {
    const ids = new Set<string>();
    conflicts.forEach(c => {
      ids.add(c.eventId1);
      ids.add(c.eventId2);
    });
    return ids;
  }, [conflicts]);

  // Ocupación por día
  const occupancyByDay = useMemo(() => {
    const occ = new Map<string, number>();
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayEvents = eventsByDay.get(dayKey) || [];
      occ.set(dayKey, calculateOccupancyRate(dayEvents, day));
    });
    return occ;
  }, [weekDays, eventsByDay]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onEventMove) return;

    const { draggableId, destination } = result;
    const event = events.find(e => e.id === draggableId);
    if (!event) return;

    // Extraer día del droppableId (formato: "day-{dayIndex}")
    const dayIndex = parseInt(destination.droppableId.replace('day-', ''));
    const targetDay = weekDays[dayIndex];

    // Calcular nueva hora
    const dropPosition = destination.index;
    const minutesFromStart = (dropPosition / AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR) * 60;
    const newStart = new Date(targetDay);
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

  const today = new Date();

  return (
    <div className="h-full flex flex-col">
      {/* Timeline con columnas de días */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Columna de horas */}
          <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200">
            <div className="h-14 border-b border-gray-200 flex items-center justify-center sticky top-0 z-10 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase">Hora</span>
            </div>
            <div 
              className="relative"
              style={{ 
                height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR)}px` 
              }}
            >
              {Array.from({ 
                length: AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR 
              }).map((_, index) => {
                const hour = AGENDA_CONFIG.START_HOUR + index;
                return (
                  <div
                    key={hour}
                    className="absolute w-full text-right pr-2"
                    style={{
                      top: `${index * AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
                      height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
                    }}
                  >
                    <span className="text-xs font-medium text-gray-600">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columnas de días */}
          <div className="flex-1 flex overflow-x-auto">
            {weekDays.map((day, dayIndex) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(dayKey) || [];
              const occupancy = occupancyByDay.get(dayKey) || 0;
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={dayKey}
                  className={`flex-1 min-w-[180px] border-r border-gray-200 last:border-r-0 ${
                    isToday ? 'bg-blue-50 bg-opacity-20' : ''
                  }`}
                >
                  {/* Header del día */}
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 h-14">
                    <div className="text-center">
                      <p className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {format(day, 'EEE', { locale: es }).toUpperCase()}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                          {format(day, 'd')}
                        </span>
                        {isToday && (
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs mt-0.5">
                        <span className="text-gray-500">{dayEvents.length}</span>
                        <span className="text-gray-400">•</span>
                        <span className={`${occupancy > 70 ? 'text-red-600' : 'text-gray-500'}`}>
                          {occupancy}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline del día */}
                  <Droppable droppableId={`day-${dayIndex}`} type="EVENT">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`relative ${
                          snapshot.isDraggingOver ? 'bg-blue-100 bg-opacity-20' : ''
                        }`}
                        style={{
                          height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR)}px`,
                        }}
                      >
                        {/* Grid de fondo */}
                        {Array.from({ 
                          length: AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR 
                        }).map((_, index) => (
                          <div
                            key={index}
                            className="absolute w-full border-t border-gray-200"
                            style={{
                              top: `${index * AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
                              height: `${AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR}px`,
                            }}
                          >
                            {[1, 2, 3].map((quarter) => (
                              <div
                                key={quarter}
                                className="absolute w-full border-t border-gray-100"
                                style={{
                                  top: `${quarter * (AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR / 4)}px`,
                                }}
                              />
                            ))}
                          </div>
                        ))}

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
                                left: '2px',
                                right: '2px',
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
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
