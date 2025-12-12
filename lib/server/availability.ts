import { adminDb } from '@/lib/firebaseAdmin';
import { addMinutes, startOfDay, endOfDay, parseISO, format } from 'date-fns';

export interface AvailabilityQuery {
  profesionalId?: string; // Si null, busca en todos los profesionales
  salaId?: string;
  fecha: Date | string;
  duracionMinutos: number;
  preferencias?: {
    horaInicio?: string; // "09:00"
    horaFin?: string; // "18:00"
    excluirAlmuerzo?: boolean;
    profesionalPreferido?: string;
  };
}

export interface SlotDisponible {
  inicio: Date;
  fin: Date;
  profesionalId: string;
  profesionalNombre: string;
  salaId?: string;
  salaNombre?: string;
  score: number; // Puntuación basada en preferencias (0-100)
  razon?: string; // Por qué tiene este score
}

interface EventoAgenda {
  id: string;
  fechaInicio: Date;
  fechaFin: Date;
  profesionalId: string;
  salaId?: string;
  estado: string;
}

/**
 * Configuración de horarios laborales
 */
const HORARIO_LABORAL = {
  inicio: '07:00',
  fin: '21:00',
  almuerzoInicio: '13:00',
  almuerzoFin: '15:00',
};

const SLOT_INTERVAL = 15; // Intervalo entre slots en minutos

/**
 * Convierte string de hora (HH:mm) a minutos desde medianoche
 */
function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos desde medianoche a Date
 */
function minutosADate(fecha: Date, minutos: number): Date {
  const resultado = startOfDay(fecha);
  resultado.setMinutes(minutos);
  return resultado;
}

/**
 * Verifica si un slot se solapa con un evento existente
 */
function hayConflicto(
  slotInicio: Date,
  slotFin: Date,
  evento: EventoAgenda
): boolean {
  return slotInicio < evento.fechaFin && slotFin > evento.fechaInicio;
}

/**
 * Obtiene eventos del día para un profesional o sala
 */
async function obtenerEventosDelDia(
  fecha: Date,
  profesionalId?: string,
  salaId?: string
): Promise<EventoAgenda[]> {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado');
  }

  const inicioDia = startOfDay(fecha);
  const finDia = endOfDay(fecha);

  let query = adminDb
    .collection('agenda-eventos')
    .where('fechaInicio', '>=', inicioDia)
    .where('fechaInicio', '<=', finDia)
    .where('estado', 'in', ['programada', 'confirmada']);

  if (profesionalId) {
    query = query.where('profesionalId', '==', profesionalId);
  }

  const snapshot = await query.get();
  const eventos: EventoAgenda[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    eventos.push({
      id: doc.id,
      fechaInicio: data.fechaInicio.toDate(),
      fechaFin: data.fechaFin.toDate(),
      profesionalId: data.profesionalId,
      salaId: data.salaId,
      estado: data.estado,
    });
  }

  // Si buscamos por sala, filtrar eventos que usen esa sala
  if (salaId) {
    return eventos.filter((e) => e.salaId === salaId);
  }

  return eventos;
}

/**
 * Obtiene lista de profesionales activos
 */
async function obtenerProfesionales(
  profesionalId?: string
): Promise<Array<{ id: string; nombre: string }>> {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado');
  }

  let query = adminDb.collection('profesionales').where('activo', '==', true);

  if (profesionalId) {
    query = query.where('__name__', '==', profesionalId);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      nombre: `${data.nombre} ${data.apellidos}`.trim(),
    };
  });
}

/**
 * Calcula score para un slot basado en preferencias
 */
function calcularScore(
  slot: Omit<SlotDisponible, 'score' | 'razon'>,
  preferencias?: AvailabilityQuery['preferencias']
): { score: number; razon: string } {
  let score = 50; // Score base
  const razones: string[] = [];

  if (!preferencias) {
    return { score, razon: 'Slot disponible' };
  }

  // Bonus por profesional preferido (+30 puntos)
  if (
    preferencias.profesionalPreferido &&
    slot.profesionalId === preferencias.profesionalPreferido
  ) {
    score += 30;
    razones.push('Profesional preferido');
  }

  // Bonus por horario preferido (+20 puntos)
  if (preferencias.horaInicio && preferencias.horaFin) {
    const horaSlot = format(slot.inicio, 'HH:mm');
    const horaInicioMin = horaAMinutos(preferencias.horaInicio);
    const horaFinMin = horaAMinutos(preferencias.horaFin);
    const horaSlotMin = horaAMinutos(horaSlot);

    if (horaSlotMin >= horaInicioMin && horaSlotMin <= horaFinMin) {
      score += 20;
      razones.push('Dentro de horario preferido');
    }
  }

  // Penalización por horarios extremos (-10 puntos)
  const hora = slot.inicio.getHours();
  if (hora < 8 || hora > 19) {
    score -= 10;
    razones.push('Horario no ideal');
  }

  // Bonus por horarios prime (9-12, 16-19) (+10 puntos)
  if ((hora >= 9 && hora < 12) || (hora >= 16 && hora < 19)) {
    score += 10;
    razones.push('Horario óptimo');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    razon: razones.join(', ') || 'Slot disponible',
  };
}

/**
 * Genera slots candidatos para un día
 */
function generarSlotsCandidatos(
  fecha: Date,
  duracionMinutos: number,
  preferencias?: AvailabilityQuery['preferencias']
): Date[] {
  const slots: Date[] = [];

  const horaInicio = preferencias?.horaInicio || HORARIO_LABORAL.inicio;
  const horaFin = preferencias?.horaFin || HORARIO_LABORAL.fin;

  const minutosInicio = horaAMinutos(horaInicio);
  const minutosFin = horaAMinutos(horaFin);

  for (
    let minutos = minutosInicio;
    minutos + duracionMinutos <= minutosFin;
    minutos += SLOT_INTERVAL
  ) {
    const slotInicio = minutosADate(fecha, minutos);
    const slotFin = addMinutes(slotInicio, duracionMinutos);

    // Excluir almuerzo si está configurado
    if (preferencias?.excluirAlmuerzo) {
      const almuerzoInicio = horaAMinutos(HORARIO_LABORAL.almuerzoInicio);
      const almuerzoFin = horaAMinutos(HORARIO_LABORAL.almuerzoFin);

      const slotInicioMin = minutos;
      const slotFinMin = minutos + duracionMinutos;

      // Saltar si el slot se solapa con el almuerzo
      if (
        !(slotFinMin <= almuerzoInicio || slotInicioMin >= almuerzoFin)
      ) {
        continue;
      }
    }

    slots.push(slotInicio);
  }

  return slots;
}

/**
 * Busca los mejores slots disponibles según criterios
 */
export async function findBestAvailableSlots(
  query: AvailabilityQuery,
  maxResults: number = 5
): Promise<SlotDisponible[]> {
  const fecha =
    typeof query.fecha === 'string' ? parseISO(query.fecha) : query.fecha;

  // 1. Obtener profesionales a considerar
  const profesionales = await obtenerProfesionales(query.profesionalId);

  if (profesionales.length === 0) {
    return [];
  }

  // 2. Generar slots candidatos
  const slotsCandidatos = generarSlotsCandidatos(
    fecha,
    query.duracionMinutos,
    query.preferencias
  );

  // 3. Para cada profesional, encontrar slots disponibles
  const slotsDisponibles: SlotDisponible[] = [];

  for (const profesional of profesionales) {
    // Obtener eventos del profesional
    const eventos = await obtenerEventosDelDia(
      fecha,
      profesional.id,
      query.salaId
    );

    // Verificar cada slot candidato
    for (const slotInicio of slotsCandidatos) {
      const slotFin = addMinutes(slotInicio, query.duracionMinutos);

      // Verificar si hay conflicto con eventos existentes
      const tieneConflicto = eventos.some((evento) =>
        hayConflicto(slotInicio, slotFin, evento)
      );

      if (!tieneConflicto) {
        const slotBase = {
          inicio: slotInicio,
          fin: slotFin,
          profesionalId: profesional.id,
          profesionalNombre: profesional.nombre,
          salaId: query.salaId,
          salaNombre: undefined, // TODO: Resolver nombre de sala
        };

        const { score, razon } = calcularScore(slotBase, query.preferencias);

        slotsDisponibles.push({
          ...slotBase,
          score,
          razon,
        });
      }
    }
  }

  // 4. Ordenar por score (mayor a menor) y retornar top N
  return slotsDisponibles
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Verifica si un slot específico está disponible
 */
export async function isSlotAvailable(
  profesionalId: string,
  inicio: Date,
  fin: Date,
  excludeEventId?: string
): Promise<boolean> {
  const eventos = await obtenerEventosDelDia(inicio, profesionalId);

  // Filtrar evento a excluir (útil para reprogramación)
  const eventosRelevantes = excludeEventId
    ? eventos.filter((e) => e.id !== excludeEventId)
    : eventos;

  return !eventosRelevantes.some((evento) => hayConflicto(inicio, fin, evento));
}
