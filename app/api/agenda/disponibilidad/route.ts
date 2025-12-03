import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addDays, startOfDay, setHours, setMinutes, isSameDay, max as dateMax } from 'date-fns';
import { adminDb } from '@/lib/firebaseAdmin';
import { AGENDA_CONFIG } from '@/components/agenda/v2/agendaHelpers';
import { validateSearchParams } from '@/lib/utils/apiValidation';
import { getCurrentUser } from '@/lib/auth/server';
import { logger } from '@/lib/utils/logger';

// Schema de validación para query params
const disponibilidadSchema = z.object({
  profesionalId: z.string().min(1, 'profesionalId es requerido'),
  days: z.coerce.number().min(1).max(7).default(3),
});

export async function GET(request: Request) {
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
