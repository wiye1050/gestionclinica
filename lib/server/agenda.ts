import { addDays } from 'date-fns';
import { adminDb } from '@/lib/firebaseAdmin';

if (!adminDb && process.env.NODE_ENV !== 'production') {
  console.warn('[agenda] Firebase Admin no disponible; los datos iniciales se cargarán en el cliente.');
}

export type SerializedAgendaEvent = {
  id: string;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  tipo: string;
  pacienteId?: string;
  pacienteNombre?: string;
  profesionalId?: string;
  profesionalNombre?: string;
  salaId?: string;
  salaNombre?: string;
  prioridad?: string;
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

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() ?? {};
    const fechaInicio = data.fechaInicio?.toDate?.() ?? new Date();
    const fechaFin = data.fechaFin?.toDate?.() ?? new Date();

    return {
      id: docSnap.id,
      titulo: data.titulo ?? 'Sin título',
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      estado: data.estado ?? 'programada',
      tipo: data.tipo ?? 'consulta',
      pacienteId: data.pacienteId ?? undefined,
      pacienteNombre: data.pacienteNombre ?? undefined,
      profesionalId: data.profesionalId ?? undefined,
      profesionalNombre: data.profesionalNombre ?? undefined,
      salaId: data.salaId ?? undefined,
      salaNombre: data.salaNombre ?? undefined,
      prioridad: data.prioridad ?? undefined,
      notas: data.notas ?? undefined,
      color: data.color ?? undefined,
    };
  });
}
