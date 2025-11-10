import { adminDb } from '@/lib/firebaseAdmin';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';

export type EvaluacionInput = {
  servicioId: string;
  servicioNombre: string;
  grupoId: string;
  grupoNombre: string;
  paciente?: string;
  profesionalId: string;
  profesionalNombre: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  tiempoEstimado: number;
  tiempoReal: number;
  aplicacionProtocolo: number;
  manejoPaciente: number;
  usoEquipamiento: number;
  comunicacion: number;
  dolorPostTratamiento: number;
  confortDuranteSesion: number;
  resultadoPercibido: number;
  protocoloSeguido: boolean;
  observaciones?: string;
  mejorasSugeridas?: string;
  fortalezasObservadas?: string;
};

const assertDb = () => {
  if (!adminDb) throw new Error('Firebase Admin no configurado');
  return adminDb;
};

export async function createEvaluacion(input: EvaluacionInput, actor: { userId: string; email?: string | null }) {
  const db = assertDb();
  const fecha = new Date(input.fecha);
  if (Number.isNaN(fecha.getTime())) {
    throw new Error('La fecha no es válida.');
  }

  const payload = {
    ...input,
    servicioNombre: sanitizeInput(input.servicioNombre),
    grupoNombre: sanitizeInput(input.grupoNombre),
    paciente: input.paciente ? sanitizeInput(input.paciente) : undefined,
    profesionalNombre: sanitizeInput(input.profesionalNombre),
    horaInicio: input.horaInicio ? sanitizeInput(input.horaInicio) : undefined,
    horaFin: input.horaFin ? sanitizeInput(input.horaFin) : undefined,
    observaciones: input.observaciones ? sanitizeHTML(input.observaciones) : undefined,
    mejorasSugeridas: input.mejorasSugeridas ? sanitizeHTML(input.mejorasSugeridas) : undefined,
    fortalezasObservadas: input.fortalezasObservadas
      ? sanitizeHTML(input.fortalezasObservadas)
      : undefined,
    fecha,
    createdAt: new Date(),
    updatedAt: new Date(),
    evaluadoPor: actor.email ?? 'desconocido',
    evaluadoPorId: actor.userId,
  } satisfies Record<string, unknown>;

  const docRef = await db.collection('evaluaciones-sesion').add(payload);
  await db.collection('auditLogs').add({
    modulo: 'supervision',
    accion: 'create',
    refId: docRef.id,
    userId: actor.userId,
    userEmail: actor.email ?? undefined,
    payload,
    createdAt: new Date(),
  });

  return { id: docRef.id };
}
