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
  calculateOccupancyRate,
} from './agendaHelpers';
import { Users, TrendingUp } from 'lucide-react';

interface Resource {
  id: string;
  nombre: string;
  tipo: 'profesional' | 'sala';
  color?: string;
}

interface AgendaResourceViewProps {
  day: Date;
  events: AgendaEvent[];
  resources: Resource[];
  onEventMove?: (eventId: string, newStart: Date, newResourceId: string) => void;
  onEventResize?: (eventId: string, newDuration: number) => void;
  onEventClick?: (event: AgendaEvent) => void;
  onQuickAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => void;
  onCreateEvent?: (start: Date, resourceId: string) => void;
  onEdit?: (event: AgendaEvent) => void;
  onDelete?: (event: AgendaEvent) => void;
}

export default function AgendaResourceView({
  day,
  events,
  resources,
  onEventMove,
  onEventResize,
  onEventClick,
  onQuickAction,
  onCreateEvent,
  onEdit,
  onDelete,
}: AgendaResourceViewProps) {
  const dayEvents = useMemo(() => getEventsForDay(events, day), [events, day]);

  // Agrupar eventos por recurso
  const eventsByResource = useMemo(() => {
    const grouped = new Map<string, AgendaEvent[]>();
    
    resources.forEach(resource => {
      const resourceEvents = dayEvents.filter(event =>
        resource.tipo === 'profesional' 
          ? event.profesionalId === resource.id
          : event.salaId === resource.id
      );
      grouped.set(resource.id, resourceEvents);
    });

    return grouped;
  }, [dayEvents, resources]);

  // Estadísticas por recurso
  const resourceStats = useMemo(() => {
    const stats = new Map<string, {
      totalEvents: number;
      occupancy: number;
      confirmed: number;
    }>();

    resources.forEach(resource => {
      const resourceEvents = eventsByResource.get(resource.id) || [];
      const occupancy = calculateOccupancyRate(resourceEvents, day);
      
      stats.set(resource.id, {
        totalEvents: resourceEvents.length,
        occupancy,
        confirmed: resourceEvents.filter(e => e.estado === 'confirmada').length,
      });
    });

    return stats;
  }, [resources, eventsByResource, day]);

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

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onEventMove) return;

    const { draggableId, destination } = result;
    const event = dayEvents.find(e => e.id === draggableId);
    if (!event) return;

    // Extraer resourceId del droppableId (formato: "resource-{resourceId}")
    const newResourceId = destination.droppableId.replace('resource-', '');

    // Calcular nueva hora
    const dropPosition = destination.index;
    const minutesFromStart = (dropPosition / AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR) * 60;
    const newStart = new Date(day);
    newStart.setHours(AGENDA_CONFIG.START_HOUR + Math.floor(minutesFromStart / 60));
    newStart.setMinutes(minutesFromStart % 60);

    const roundedStart = roundToNearestSlot(newStart);
    onEventMove(event.id, roundedStart, newResourceId);
  };

  // Handle resize
  const handleResize = (eventId: string, newDurationMinutes: number) => {
    if (onEventResize) {
      onEventResize(eventId, newDurationMinutes);
    }
  };

  const dayLabel = format(day, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 capitalize">{dayLabel}</h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
              {resources.length} recursos
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
              {dayEvents.length} eventos
            </span>
            {conflicts.length > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                {conflicts.length} conflictos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vista de recursos */}
      <div className="flex-1 relative">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full">
            {/* Columna de horas (compartida) */}
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

            {/* Columnas de recursos */}
            <div className="flex-1 flex overflow-x-auto">
              {resources.map((resource) => {
                const resourceEvents = eventsByResource.get(resource.id) || [];
                const stats = resourceStats.get(resource.id);

                return (
                  <div
                    key={resource.id}
                    className="flex-1 min-w-[250px] border-r border-gray-200 last:border-r-0"
                  >
                    {/* Header del recurso */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 h-14">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {resource.nombre}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span>{stats?.totalEvents || 0} eventos</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{stats?.occupancy || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline del recurso */}
                    <Droppable droppableId={`resource-${resource.id}`} type="EVENT">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`relative ${
                            snapshot.isDraggingOver ? 'bg-blue-50 bg-opacity-30' : ''
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
                          {resourceEvents.map((event, index) => {
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
                                  left: '4px',
                                  right: '4px',
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
    </div>
  );
}
