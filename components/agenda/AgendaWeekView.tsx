'use client';

import { useMemo } from 'react';
import { EstadoEventoAgenda } from '@/types';
import { addMinutes } from 'date-fns';

export interface AgendaEventDisplay {
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

export interface AgendaBlockDisplay {
  id: string;
  profesionalNombre?: string;
  salaNombre?: string;
  diaSemana: number; // 0 = lunes
  horaInicio: string;
  horaFin: string;
  tipo: 'disponible' | 'bloqueado' | 'descanso';
  motivo?: string;
}

interface AgendaWeekViewProps {
  weekDays: Date[];
  events: AgendaEventDisplay[];
  blocks: AgendaBlockDisplay[];
  onUpdateEvent?: (event: AgendaEventDisplay, estado: EstadoEventoAgenda) => Promise<void> | void;
  updatingEventId?: string | null;
}

const estadoClasses: Record<string, string> = {
  programada: 'bg-blue-100 text-blue-700 border border-blue-200',
  confirmada: 'bg-green-100 text-green-700 border border-green-200',
  realizada: 'bg-gray-100 text-gray-600 border border-gray-200',
  cancelada: 'bg-red-100 text-red-700 border border-red-200'
};

const prioridadClasses: Record<string, string> = {
  alta: 'text-red-600',
  media: 'text-yellow-600',
  baja: 'text-gray-500'
};

function formatDayLabel(day: Date) {
  return day.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });
}

function formatTimeRange(start: Date, end: Date) {
  const startLabel = start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${startLabel} - ${endLabel}`;
}

function getDayIndex(day: Date) {
  return (day.getDay() + 6) % 7;
}

export function AgendaWeekView({
  weekDays,
  events,
  blocks,
  onUpdateEvent,
  updatingEventId
}: AgendaWeekViewProps) {
  const eventsByDay = useMemo(() => {
    return weekDays.map((day) => {
      const dayIndex = getDayIndex(day);
      const filtered = events
        .filter((evento) => getDayIndex(evento.fechaInicio) === dayIndex)
        .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime());
      return filtered;
    });
  }, [weekDays, events]);

  const blocksByDay = useMemo(() => {
    return weekDays.map((day) => {
      const dayIndex = getDayIndex(day);
      return blocks.filter((block) => block.diaSemana === dayIndex);
    });
  }, [weekDays, blocks]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      {weekDays.map((day, index) => {
        const dayEvents = eventsByDay[index];
        const dayBlocks = blocksByDay[index];

        return (
          <section
            key={day.toISOString()}
            className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <header className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold capitalize text-gray-800">
                {formatDayLabel(day)}
              </p>
            </header>

            <div className="flex-1 space-y-3 px-4 py-3 text-sm">
              {dayBlocks.length > 0 && (
                <div className="space-y-2 rounded-md border border-dashed border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Disponibilidad
                  </p>
                  <ul className="space-y-1">
                    {dayBlocks.map((block) => (
                      <li key={block.id} className="flex flex-col text-gray-600">
                        <span>
                          {block.horaInicio} - {block.horaFin}{' '}
                          <span className="text-xs uppercase text-gray-400">({block.tipo})</span>
                        </span>
                        {block.profesionalNombre && (
                          <span className="text-xs text-gray-500">
                            Profesional: {block.profesionalNombre}
                          </span>
                        )}
                        {block.salaNombre && (
                          <span className="text-xs text-gray-500">Sala: {block.salaNombre}</span>
                        )}
                        {block.motivo && (
                          <span className="text-xs text-gray-400 italic">{block.motivo}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {dayEvents.length === 0 ? (
                <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-gray-500">
                  No hay eventos registrados.
                </p>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((event) => {
                    const estadoClass = estadoClasses[event.estado] ?? 'bg-gray-100 text-gray-600';
                    const prioridadClass =
                      event.prioridad && prioridadClasses[event.prioridad]
                        ? prioridadClasses[event.prioridad]
                        : 'text-gray-500';

                    const durationMinutes = Math.max(
                      30,
                      (event.fechaFin.getTime() - event.fechaInicio.getTime()) / (1000 * 60)
                    );
                    const endTime = addMinutes(event.fechaInicio, durationMinutes);

                    const isUpdating = updatingEventId === event.id;
                    const renderActions = onUpdateEvent
                      ? [
                          {
                            label: 'Confirmar',
                            next: 'confirmada' as EstadoEventoAgenda,
                            show: event.estado === 'programada'
                          },
                          {
                            label: 'Completar',
                            next: 'realizada' as EstadoEventoAgenda,
                            show: event.estado === 'confirmada'
                          },
                          {
                            label: 'Cancelar',
                            next: 'cancelada' as EstadoEventoAgenda,
                            show: event.estado !== 'cancelada'
                          }
                        ].filter((action) => action.show)
                      : [];

                    return (
                      <article
                        key={event.id}
                        className={`space-y-2 rounded-lg px-3 py-3 text-sm shadow-sm ${estadoClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm capitalize">
                            {event.titulo || 'Evento sin título'}
                          </h3>
                          <span className={`text-xs font-semibold uppercase ${prioridadClass}`}>
                            {event.prioridad ?? 'media'}
                          </span>
                        </div>
                        <p className="text-xs font-medium">
                          {formatTimeRange(event.fechaInicio, event.fechaFin ?? endTime)}
                        </p>
                        {event.pacienteNombre && (
                          <p className="text-xs">Paciente: {event.pacienteNombre}</p>
                        )}
                        {event.profesionalNombre && (
                          <p className="text-xs text-gray-700">
                            Profesional: {event.profesionalNombre}
                          </p>
                        )}
                        {event.salaNombre && (
                          <p className="text-xs text-gray-700">Sala: {event.salaNombre}</p>
                        )}
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Estado: {event.estado}
                        </p>
                        {renderActions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 text-xs">
                            {renderActions.map((action) => (
                              <button
                                key={action.next}
                                type="button"
                                onClick={() => onUpdateEvent?.(event, action.next)}
                                disabled={isUpdating}
                                className="rounded-md border border-blue-200 px-2 py-1 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUpdating ? 'Actualizando...' : action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
