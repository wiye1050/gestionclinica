import type { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import type { SerializedAgendaEvent } from '@/lib/server/agenda';

export const deserializeAgendaEvent = (event: SerializedAgendaEvent): AgendaEvent => ({
  ...event,
  fechaInicio: new Date(event.fechaInicio),
  fechaFin: new Date(event.fechaFin),
  estado: (event.estado as AgendaEvent['estado']) ?? 'programada',
  tipo: (event.tipo as AgendaEvent['tipo']) ?? 'consulta',
  prioridad: event.prioridad ? (event.prioridad as AgendaEvent['prioridad']) : undefined,
});

export const deserializeAgendaEvents = (events: SerializedAgendaEvent[]): AgendaEvent[] =>
  events.map(deserializeAgendaEvent);
