'use client';

import { useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import type { CatalogoServicio } from '@/types';

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
  catalogoServicios?: CatalogoServicio[];
  onEventMove?: (eventId: string, newStart: Date, newResourceId: string) => void;
  onEventResize?: (eventId: string, newDuration: number) => void;
  onEventClick?: (event: AgendaEvent) => void;
  onQuickAction?: (event: AgendaEvent, action: 'confirm' | 'complete' | 'cancel') => void;
  onEdit?: (event: AgendaEvent) => void;
  onDelete?: (event: AgendaEvent) => void;
  hourHeight?: number;
}

export default function AgendaResourceView({
  day,
  events,
  resources,
  catalogoServicios = [],
  onEventMove,
  onEventResize,
  onEventClick,
  onQuickAction,
  onEdit,
  onDelete,
  hourHeight = AGENDA_CONFIG.TIMELINE_HEIGHT_PER_HOUR,
}: AgendaResourceViewProps) {
  const dayEvents = useMemo(() => getEventsForDay(events, day), [events, day]);
  const timelineHeight = useMemo(
    () => hourHeight * (AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR),
    [hourHeight]
  );

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
    const minutesFromStart = (dropPosition / hourHeight) * 60;
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
  const overallOccupancy = useMemo(() => calculateOccupancyRate(dayEvents, day), [dayEvents, day]);

  return (
    <div className="flex h-full flex-col rounded-[28px] bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize text-text">{dayLabel}</p>
            <p className="text-xs text-text-muted">
              {resources.length} recursos · {dayEvents.length} eventos programados
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-brand-subtle px-3 py-1 text-brand">
            {dayEvents.length} eventos
          </span>
          <span className="rounded-full bg-success-bg px-3 py-1 text-success">
            {overallOccupancy}% ocupación
          </span>
          {conflicts.length > 0 && (
            <span className="rounded-full bg-danger-bg px-3 py-1 text-danger">
              {conflicts.length} conflictos
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-b-[28px]">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full overflow-hidden">
            <div className="flex h-full w-full overflow-y-auto">
              <div className="flex min-h-full min-w-full">
                <div className="sticky left-0 z-30 flex w-20 flex-shrink-0 flex-col border-r border-border bg-card">
                  <div className="flex h-16 items-center justify-center border-b border-border bg-card">
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Hora
                    </span>
                  </div>
                  <div className="relative" style={{ height: `${timelineHeight}px` }}>
                    {Array.from({ length: AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR }).map(
                      (_, index) => {
                        const hour = AGENDA_CONFIG.START_HOUR + index;
                        return (
                          <div
                            key={hour}
                            className="absolute inset-x-0 border-t border-border/60 px-1"
                            style={{
                              top: `${index * hourHeight}px`,
                              height: `${hourHeight}px`,
                            }}
                          >
                            <span className="text-xs font-semibold text-text-muted">
                              {String(hour).padStart(2, '0')}:00
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <div className="flex min-h-full min-w-full">
                    {resources.map((resource) => {
                      const resourceEvents = eventsByResource.get(resource.id) || [];
                      const stats = resourceStats.get(resource.id);
                      const occupancyLabel = Math.round(stats?.occupancy ?? 0);

                      // Color dinámico del profesional (con fallback)
                      const resourceColor = resource.color || '#3B82F6';
                      const softBg =
                        resourceColor.startsWith('#') && (resourceColor.length === 7 || resourceColor.length === 9)
                          ? `${resourceColor.slice(0, 7)}26` // ~15% alpha
                          : 'rgba(0, 135, 205, 0.12)';
                      const softBorder =
                        resourceColor.startsWith('#') && (resourceColor.length === 7 || resourceColor.length === 9)
                          ? `${resourceColor.slice(0, 7)}66`
                          : 'rgba(0, 135, 205, 0.4)';

                      return (
                        <div
                          key={resource.id}
                          className="flex min-w-[260px] flex-1 flex-col border-r border-border/60 bg-cardHover/20 p-1 last:border-r-0"
                        >
                          <div
                            className="sticky top-0 z-20 flex h-16 flex-col justify-center gap-1 rounded-2xl border px-3 text-sm backdrop-blur"
                            style={{
                              backgroundColor: softBg,
                              borderColor: softBorder,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: resourceColor }}
                              />
                              <h3 className="truncate font-semibold text-text">{resource.nombre}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                              <span>{stats?.totalEvents ?? resourceEvents.length} citas</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {occupancyLabel}% ocupación
                              </span>
                              <span>•</span>
                              <span>{stats?.confirmed ?? 0} confirmadas</span>
                            </div>
                          </div>

                          <Droppable droppableId={`resource-${resource.id}`} type="EVENT">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`relative rounded-2xl border border-transparent bg-card transition-colors ${
                                  snapshot.isDraggingOver ? 'border-brand/40 bg-brand-subtle/40' : ''
                                }`}
                                style={{ height: `${timelineHeight}px` }}
                              >
                                {Array.from({
                                  length: AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR,
                                }).map((_, indexHour) => (
                                  <div
                                    key={indexHour}
                                    className="absolute inset-x-0 border-t border-border/40"
                                    style={{
                                      top: `${indexHour * hourHeight}px`,
                                      height: `${hourHeight}px`,
                                    }}
                                  >
                                    {[1, 2, 3].map((quarter) => (
                                      <div
                                        key={quarter}
                                        className="absolute inset-x-2 border-t border-border/30"
                                        style={{
                                          top: `${quarter * (hourHeight / 4)}px`,
                                        }}
                                      />
                                    ))}
                                  </div>
                                ))}

                                {resourceEvents.map((event, eventIndex) => {
                                  const position = calculateEventPosition(event, hourHeight);
                                  const hasConflict = conflictEventIds.has(event.id);

                                  return (
                                    <AgendaEventCard
                                      key={event.id}
                                      event={event}
                                      index={eventIndex}
                                      catalogoServicios={catalogoServicios}
                                      style={{
                                        top: `${position.top}px`,
                                        height: `${position.height}px`,
                                        left: '6px',
                                        right: '6px',
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
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
