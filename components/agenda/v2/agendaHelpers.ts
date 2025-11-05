import { format, differenceInMinutes, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export interface AgendaEvent {
  id: string;
  titulo: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  tipo: 'consulta' | 'seguimiento' | 'revision' | 'tratamiento' | 'urgencia' | 'administrativo';
  pacienteId?: string;
  pacienteNombre?: string;
  profesionalId?: string;
  profesionalNombre?: string;
  salaId?: string;
  salaNombre?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  notas?: string;
  color?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  time: string;
}

export interface Conflict {
  eventId1: string;
  eventId2: string;
  type: 'overlap' | 'same-resource' | 'double-booking';
  severity: 'warning' | 'error';
}

// Constantes de configuración
export const AGENDA_CONFIG = {
  START_HOUR: 7,
  END_HOUR: 21,
  SLOT_DURATION: 15, // minutos
  MIN_EVENT_DURATION: 15,
  DEFAULT_EVENT_DURATION: 30,
  TIMELINE_HEIGHT_PER_HOUR: 80, // pixels
};

// Colores por tipo de cita
export const EVENT_TYPE_COLORS = {
  consulta: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-gray-900' },
  seguimiento: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-gray-900' },
  revision: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-gray-900' },
  tratamiento: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-gray-900' },
  urgencia: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-gray-900' },
  administrativo: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-900' },
};

// Colores por estado
export const EVENT_STATE_STYLES = {
  programada: 'border-2 border-dashed',
  confirmada: 'border-2 border-solid',
  realizada: 'opacity-50',
  cancelada: 'line-through opacity-40',
};

// Generar slots de tiempo
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const { START_HOUR, END_HOUR, SLOT_DURATION } = AGENDA_CONFIG;

  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_DURATION) {
      slots.push({
        hour,
        minute,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      });
    }
  }

  return slots;
}

// Calcular posición vertical de un evento en el timeline
export function calculateEventPosition(event: AgendaEvent): {
  top: number;
  height: number;
} {
  const { START_HOUR, TIMELINE_HEIGHT_PER_HOUR } = AGENDA_CONFIG;
  const startMinutes = event.fechaInicio.getHours() * 60 + event.fechaInicio.getMinutes();
  const endMinutes = event.fechaFin.getHours() * 60 + event.fechaFin.getMinutes();
  const startOffset = startMinutes - START_HOUR * 60;
  
  const top = (startOffset / 60) * TIMELINE_HEIGHT_PER_HOUR;
  const duration = endMinutes - startMinutes;
  const height = (duration / 60) * TIMELINE_HEIGHT_PER_HOUR;

  return { top, height: Math.max(height, 40) }; // mínimo 40px
}

// Detectar conflictos entre eventos
export function detectConflicts(events: AgendaEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];

      // Mismo día?
      if (!isSameDay(event1.fechaInicio, event2.fechaInicio)) continue;

      // Overlap de tiempo?
      const hasOverlap =
        (event1.fechaInicio < event2.fechaFin && event1.fechaFin > event2.fechaInicio) ||
        (event2.fechaInicio < event1.fechaFin && event2.fechaFin > event1.fechaInicio);

      if (hasOverlap) {
        // Mismo profesional o sala?
        const sameResource =
          (event1.profesionalId && event1.profesionalId === event2.profesionalId) ||
          (event1.salaId && event1.salaId === event2.salaId);

        conflicts.push({
          eventId1: event1.id,
          eventId2: event2.id,
          type: sameResource ? 'double-booking' : 'overlap',
          severity: sameResource ? 'error' : 'warning',
        });
      }
    }
  }

  return conflicts;
}

// Formatear duración
export function formatDuration(start: Date, end: Date): string {
  const minutes = differenceInMinutes(end, start);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Formatear hora
export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: es });
}

// Formatear rango de tiempo
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

// Obtener eventos de un día
export function getEventsForDay(events: AgendaEvent[], day: Date): AgendaEvent[] {
  return events.filter((event) => isSameDay(event.fechaInicio, day));
}

// Calcular posición de hora actual
export function getCurrentTimePosition(): number {
  const now = new Date();
  const { START_HOUR, TIMELINE_HEIGHT_PER_HOUR } = AGENDA_CONFIG;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startOffset = currentMinutes - START_HOUR * 60;
  return (startOffset / 60) * TIMELINE_HEIGHT_PER_HOUR;
}

// Verificar si una hora está dentro del horario laboral
export function isWithinWorkingHours(hour: number): boolean {
  const { START_HOUR, END_HOUR } = AGENDA_CONFIG;
  return hour >= START_HOUR && hour < END_HOUR;
}

// Redondear fecha al slot más cercano
export function roundToNearestSlot(date: Date): Date {
  const { SLOT_DURATION } = AGENDA_CONFIG;
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / SLOT_DURATION) * SLOT_DURATION;
  const newDate = new Date(date);
  newDate.setMinutes(roundedMinutes);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
}

// Calcular huecos libres en un día
export function calculateFreeSlots(
  events: AgendaEvent[],
  day: Date,
  profesionalId?: string
): Array<{ start: Date; end: Date }> {
  let filteredEvents = getEventsForDay(events, day);
  if (profesionalId) {
    filteredEvents = filteredEvents.filter(e => e.profesionalId === profesionalId);
  }

  // Ordenar por hora inicio
  filteredEvents.sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime());

  const freeSlots: Array<{ start: Date; end: Date }> = [];
  const workStart = new Date(day);
  workStart.setHours(AGENDA_CONFIG.START_HOUR, 0, 0, 0);
  
  const workEnd = new Date(day);
  workEnd.setHours(AGENDA_CONFIG.END_HOUR, 0, 0, 0);

  let currentTime = workStart;

  for (const event of filteredEvents) {
    if (event.fechaInicio > currentTime) {
      freeSlots.push({
        start: new Date(currentTime),
        end: new Date(event.fechaInicio),
      });
    }
    currentTime = event.fechaFin > currentTime ? event.fechaFin : currentTime;
  }

  if (currentTime < workEnd) {
    freeSlots.push({
      start: new Date(currentTime),
      end: workEnd,
    });
  }

  return freeSlots;
}

// Calcular porcentaje de ocupación
export function calculateOccupancyRate(events: AgendaEvent[], day: Date): number {
  const { START_HOUR, END_HOUR } = AGENDA_CONFIG;
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  
  const dayEvents = getEventsForDay(events, day);
  const occupiedMinutes = dayEvents.reduce((sum, event) => {
    return sum + differenceInMinutes(event.fechaFin, event.fechaInicio);
  }, 0);

  return Math.round((occupiedMinutes / totalMinutes) * 100);
}
