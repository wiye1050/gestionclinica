import { adminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/utils/logger';

interface EventForConflictCheck {
  id?: string; // Si es update, excluir este evento
  fechaInicio: Date;
  fechaFin: Date;
  profesionalId?: string | null;
  salaId?: string | null;
}

export interface ConflictDetails {
  conflictingEventId: string;
  conflictingEventTitulo: string;
  conflictType: 'double-booking-profesional' | 'double-booking-sala' | 'overlap';
  severity: 'error' | 'warning';
}

/**
 * Valida si un evento tiene conflictos con otros eventos existentes
 *
 * Tipos de conflictos:
 * - ERROR: Mismo profesional o sala con horario superpuesto
 * - WARNING: Overlap de tiempo sin mismo recurso (informativo)
 *
 * @param event - Evento a validar
 * @returns null si no hay conflictos, o detalles del conflicto
 */
export async function checkEventConflicts(
  event: EventForConflictCheck
): Promise<ConflictDetails | null> {
  if (!adminDb) {
    logger.warn('[agendaValidation] Admin DB not available, skipping conflict check');
    return null;
  }

  try {
    // Obtener eventos del mismo día
    const startOfDay = new Date(event.fechaInicio);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(event.fechaInicio);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await adminDb
      .collection('agenda-eventos')
      .where('fechaInicio', '>=', startOfDay)
      .where('fechaInicio', '<=', endOfDay)
      .get();

    // Filtrar eventos cancelados y el evento actual (si es update)
    const existingEvents = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        // Excluir evento actual si es update
        if (event.id && doc.id === event.id) return false;
        // Excluir eventos cancelados
        if (data.estado === 'cancelada') return false;
        return true;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo ?? 'Sin título',
          fechaInicio: data.fechaInicio?.toDate() ?? new Date(),
          fechaFin: data.fechaFin?.toDate() ?? new Date(),
          profesionalId: data.profesionalId ?? null,
          salaId: data.salaId ?? null,
        };
      });

    // Detectar conflictos
    for (const existing of existingEvents) {
      // Verificar overlap de tiempo
      const hasOverlap =
        (event.fechaInicio < existing.fechaFin && event.fechaFin > existing.fechaInicio) ||
        (existing.fechaInicio < event.fechaFin && existing.fechaFin > event.fechaInicio);

      if (hasOverlap) {
        // Conflicto crítico: mismo profesional
        if (event.profesionalId && event.profesionalId === existing.profesionalId) {
          return {
            conflictingEventId: existing.id,
            conflictingEventTitulo: existing.titulo,
            conflictType: 'double-booking-profesional',
            severity: 'error',
          };
        }

        // Conflicto crítico: misma sala
        if (event.salaId && event.salaId === existing.salaId) {
          return {
            conflictingEventId: existing.id,
            conflictingEventTitulo: existing.titulo,
            conflictType: 'double-booking-sala',
            severity: 'error',
          };
        }

        // Overlap sin mismo recurso (warning, pero permitido)
        // No retornamos este conflicto, solo los críticos
      }
    }

    return null; // No hay conflictos críticos
  } catch (error) {
    logger.error('[agendaValidation] Error checking conflicts:', error as Error);
    // En caso de error, no bloquear la operación
    return null;
  }
}

/**
 * Valida que las fechas de un evento sean válidas
 */
export function validateEventDates(fechaInicio: Date, fechaFin: Date): string | null {
  // Fechas válidas
  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    return 'Fechas inválidas';
  }

  // Fecha fin debe ser después de fecha inicio
  if (fechaFin <= fechaInicio) {
    return 'La fecha de fin debe ser posterior a la fecha de inicio';
  }

  // Duración mínima 5 minutos
  const durationMinutes = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60);
  if (durationMinutes < 5) {
    return 'La duración mínima de un evento es 5 minutos';
  }

  // Duración máxima 8 horas
  if (durationMinutes > 480) {
    return 'La duración máxima de un evento es 8 horas';
  }

  // No permitir eventos en el pasado (más de 1 hora)
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  if (fechaInicio < oneHourAgo) {
    return 'No se pueden crear eventos con más de 1 hora en el pasado';
  }

  return null;
}
