import { addDays } from 'date-fns';
import { adminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/utils/logger';

if (!adminDb && process.env.NODE_ENV !== 'production') {
  logger.warn('[agenda] Firebase Admin no disponible; los datos iniciales se cargarán en el cliente.');
}

export type SerializedAgendaEvent = {
  id: string;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  tipo: 'consulta' | 'seguimiento' | 'revision' | 'tratamiento' | 'urgencia' | 'administrativo';
  pacienteId?: string;
  pacienteNombre?: string;
  profesionalId: string; // REQUERIDO - siempre debe haber un profesional asignado
  profesionalNombre?: string;
  salaId?: string;
  salaNombre?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  notas?: string;
  color?: string;
};

export async function getSerializedAgendaEvents(weekStart: Date): Promise<SerializedAgendaEvent[]> {
  if (!adminDb) {
    return [];
  }

  const weekEnd = addDays(weekStart, 7);

  const snapshot = await adminDb
    .collection('agenda-eventos')
    .where('fechaInicio', '>=', weekStart)
    .where('fechaInicio', '<', weekEnd)
    .orderBy('fechaInicio', 'asc')
    .limit(500)
    .get();

  const events: SerializedAgendaEvent[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() ?? {};

    // profesionalId es REQUERIDO - filtrar eventos sin profesional
    if (!data.profesionalId) {
      logger.warn(`[agenda] Evento ${docSnap.id} sin profesionalId - será omitido`);
      continue;
    }

    const fechaInicio = data.fechaInicio?.toDate?.() ?? new Date();
    const fechaFin = data.fechaFin?.toDate?.() ?? new Date();

    events.push({
      id: docSnap.id,
      titulo: data.titulo ?? 'Sin título',
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      estado: data.estado ?? 'programada',
      tipo: data.tipo ?? 'consulta',
      pacienteId: data.pacienteId ?? undefined,
      pacienteNombre: data.pacienteNombre ?? undefined,
      profesionalId: data.profesionalId, // REQUERIDO - ya verificado arriba
      profesionalNombre: data.profesionalNombre ?? undefined,
      salaId: data.salaId ?? undefined,
      salaNombre: data.salaNombre ?? undefined,
      prioridad: data.prioridad ?? undefined,
      notas: data.notas ?? undefined,
      color: data.color ?? undefined,
    });
  }

  return events;
}
