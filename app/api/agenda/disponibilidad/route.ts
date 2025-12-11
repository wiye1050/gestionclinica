import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addDays, startOfDay, setHours, setMinutes, isSameDay, max as dateMax } from 'date-fns';
import { adminDb } from '@/lib/firebaseAdmin';
import { AGENDA_CONFIG } from '@/components/agenda/v2/agendaHelpers';
import { validateSearchParams } from '@/lib/utils/apiValidation';
import { getCurrentUser } from '@/lib/auth/server';
import { logger } from '@/lib/utils/logger';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

// Schema de validación para query params
const disponibilidadSchema = z.object({
  profesionalId: z.string().min(1, 'profesionalId es requerido'),
  days: z.coerce.number().min(1).max(7).default(3),
});

const limiter = rateLimit(RATE_LIMIT_STRICT);

/**
 * GET /api/agenda/disponibilidad
 * Calcula slots de tiempo disponibles para un profesional en los próximos días
 *
 * @async
 * @param {NextRequest} request - Request de Next.js
 *
 * @query {string} profesionalId - ID del profesional (requerido)
 * @query {number} [days=3] - Número de días a consultar (1-7)
 *
 * @returns {Promise<NextResponse>} Slots disponibles
 * @returns {200} Éxito - { slots: AvailabilitySlot[] }
 * @returns {400} Parámetros inválidos
 * @returns {401} No autenticado
 * @returns {403} No autorizado (requiere rol específico)
 * @returns {500} Error del servidor
 *
 * @typedef {Object} AvailabilitySlot
 * @property {string} start - Fecha/hora ISO de inicio del slot
 * @property {string} end - Fecha/hora ISO de fin del slot
 * @property {number} durationMinutes - Duración en minutos
 *
 * @security Requiere autenticación
 * @security Requiere rol: admin | coordinador | profesional | recepcion
 *
 * @algorithm
 * 1. Obtiene eventos del profesional en el rango de días
 * 2. Para cada día, calcula gaps entre eventos
 * 3. Filtra gaps menores a MIN_EVENT_DURATION (30 min)
 * 4. Respeta horario de trabajo (START_HOUR - END_HOUR)
 * 5. Retorna máximo 6 slots disponibles
 *
 * @example
 * // Obtener disponibilidad para 5 días
 * GET /api/agenda/disponibilidad?profesionalId=prof-123&days=5
 *
 * @example
 * // Respuesta exitosa
 * {
 *   "slots": [
 *     {
 *       "start": "2024-03-20T09:00:00.000Z",
 *       "end": "2024-03-20T10:00:00.000Z",
 *       "durationMinutes": 60
 *     },
 *     {
 *       "start": "2024-03-20T14:30:00.000Z",
 *       "end": "2024-03-20T16:00:00.000Z",
 *       "durationMinutes": 90
 *     }
 *   ]
 * }
 *
 * @note Solo considera eventos del profesional específico
 * @note Ignora slots menores a 30 minutos
 * @note Limita resultados a 6 slots máximo
 *
 * @throws {ZodError} Si los parámetros no pasan la validación
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const allowedRoles = new Set(['admin', 'coordinador', 'profesional', 'recepcion']);
    const hasAccess = (currentUser.roles ?? []).some((role) => allowedRoles.has(role));
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Validar parámetros con Zod
    const validation = validateSearchParams(searchParams, disponibilidadSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { profesionalId, days } = validation.data;

    if (!adminDb) {
      return NextResponse.json({ slots: [] });
    }

    const now = new Date();
    const endDate = addDays(now, days);

    const snapshot = await adminDb
      .collection('agenda-eventos')
      .where('fechaInicio', '>=', now)
      .where('fechaInicio', '<', endDate)
      .orderBy('fechaInicio', 'asc')
      .limit(500)
      .get();

    const events = snapshot.docs
      .map((doc) => {
        const data = doc.data() ?? {};
        const start = data.fechaInicio?.toDate?.() ?? new Date();
        const end = data.fechaFin?.toDate?.() ?? new Date(start.getTime() + 30 * 60000);
        return {
          profesionalId: data.profesionalId as string | undefined,
          start,
          end,
        };
      })
      .filter((event) => event.profesionalId === profesionalId)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const slots: Array<{ start: string; end: string; durationMinutes: number }> = [];
    const daysToProcess = days;

    for (let dayOffset = 0; dayOffset < daysToProcess && slots.length < 6; dayOffset++) {
      const currentDay = addDays(now, dayOffset);
      const dayStart = setMinutes(
        setHours(startOfDay(currentDay), AGENDA_CONFIG.START_HOUR),
        0
      );
      const dayEnd = setMinutes(
        setHours(startOfDay(currentDay), AGENDA_CONFIG.END_HOUR),
        0
      );

      let pointer = new Date(Math.max(dayStart.getTime(), now.getTime()));
      const dayEvents = events.filter((event) => isSameDay(event.start, currentDay));

      dayEvents.forEach((event) => {
        if (event.start > pointer) {
          const gapMinutes = (event.start.getTime() - pointer.getTime()) / 60000;
          if (gapMinutes >= AGENDA_CONFIG.MIN_EVENT_DURATION) {
            slots.push({
              start: pointer.toISOString(),
              end: event.start.toISOString(),
              durationMinutes: Math.round(gapMinutes),
            });
          }
        }
        pointer = dateMax([pointer, event.end]);
      });

      if (pointer < dayEnd) {
        const gapMinutes = (dayEnd.getTime() - pointer.getTime()) / 60000;
        if (gapMinutes >= AGENDA_CONFIG.MIN_EVENT_DURATION) {
          slots.push({
            start: pointer.toISOString(),
            end: dayEnd.toISOString(),
            durationMinutes: Math.round(gapMinutes),
          });
        }
      }
    }

    return NextResponse.json({ slots: slots.slice(0, 6) });
  } catch (error) {
    logger.error('[agenda|disponibilidad]', error as Error);
    return NextResponse.json({ error: 'No se pudo obtener disponibilidad' }, { status: 500 });
  }
}
