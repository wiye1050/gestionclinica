import { NextResponse } from 'next/server';
import { addDays, startOfDay, setHours, setMinutes, isSameDay, max as dateMax } from 'date-fns';
import { adminDb } from '@/lib/firebaseAdmin';
import { AGENDA_CONFIG } from '@/components/agenda/v2/agendaHelpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profesionalId = searchParams.get('profesionalId');
    const days = Number(searchParams.get('days') ?? '3');

    if (!profesionalId) {
      return NextResponse.json({ error: 'Falta profesionalId' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ slots: [] });
    }

    const now = new Date();
    const endDate = addDays(now, Math.min(Math.max(days, 1), 7));

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
    const daysToProcess = Math.min(Math.max(days, 1), 7);

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
    console.error('[agenda|disponibilidad]', error);
    return NextResponse.json({ error: 'No se pudo obtener disponibilidad' }, { status: 500 });
  }
}

