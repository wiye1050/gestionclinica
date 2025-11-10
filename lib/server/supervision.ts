import { adminDb } from '@/lib/firebaseAdmin';
import type {
  EvaluacionSesion,
  ServicioAsignado,
  Profesional,
  GrupoPaciente,
} from '@/types';

const dateToISO = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const fn = (value as { toDate?: () => Date }).toDate;
    if (typeof fn === 'function') {
      try {
        return fn().toISOString();
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
};

export type SerializedEvaluacion = Omit<EvaluacionSesion, 'fecha' | 'createdAt' | 'updatedAt'> & {
  fecha?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedServicio = Omit<
  ServicioAsignado,
  'createdAt' | 'updatedAt' | 'fechaProgramada'
> & {
  createdAt?: string;
  updatedAt?: string;
  fechaProgramada?: string;
};

export type SerializedProfesional = Omit<Profesional, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedGrupo = Omit<GrupoPaciente, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

const serializeDocs = <T extends { id: string }>(
  snapshot: FirebaseFirestore.QuerySnapshot,
  mapper: (data: FirebaseFirestore.DocumentData, id: string) => T
): T[] => snapshot.docs.map((docSnap) => mapper(docSnap.data() ?? {}, docSnap.id));

export async function getSerializedEvaluaciones(): Promise<SerializedEvaluacion[]> {
  if (!adminDb) return [];

  const snapshot = await adminDb.collection('evaluaciones-sesion').orderBy('fecha', 'desc').get();
  return serializeDocs(snapshot, (data, id) => ({
    id,
    servicioId: data.servicioId,
    servicioNombre: data.servicioNombre,
    grupoId: data.grupoId,
    grupoNombre: data.grupoNombre,
    paciente: data.paciente,
    profesionalId: data.profesionalId,
    profesionalNombre: data.profesionalNombre,
    fecha: dateToISO(data.fecha),
    horaInicio: data.horaInicio,
    horaFin: data.horaFin,
    tiempoEstimado: data.tiempoEstimado,
    tiempoReal: data.tiempoReal,
    aplicacionProtocolo: data.aplicacionProtocolo,
    manejoPaciente: data.manejoPaciente,
    usoEquipamiento: data.usoEquipamiento,
    comunicacion: data.comunicacion,
    dolorPostTratamiento: data.dolorPostTratamiento,
    confortDuranteSesion: data.confortDuranteSesion,
    resultadoPercibido: data.resultadoPercibido,
    protocoloSeguido: Boolean(data.protocoloSeguido),
    observaciones: data.observaciones,
    mejorasSugeridas: data.mejorasSugeridas,
    fortalezasObservadas: data.fortalezasObservadas,
    evaluadoPor: data.evaluadoPor,
    evaluadoPorId: data.evaluadoPorId,
    createdAt: dateToISO(data.createdAt),
    updatedAt: dateToISO(data.updatedAt),
  }));
}

export async function getSerializedServiciosActuales(): Promise<SerializedServicio[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb
    .collection('servicios-asignados')
    .where('esActual', '==', true)
    .get();
  return serializeDocs(snapshot, (data, id) => ({
    id,
    ...data,
    createdAt: dateToISO(data.createdAt),
    updatedAt: dateToISO(data.updatedAt),
    fechaProgramada: dateToISO(data.fechaProgramada),
  })) as SerializedServicio[];
}

export async function getSerializedProfesionales(): Promise<SerializedProfesional[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection('profesionales').where('activo', '==', true).get();
  return serializeDocs(snapshot, (data, id) => ({
    id,
    ...data,
    createdAt: dateToISO(data.createdAt),
    updatedAt: dateToISO(data.updatedAt),
  })) as SerializedProfesional[];
}

export async function getSerializedGrupos(): Promise<SerializedGrupo[]> {
  if (!adminDb) return [];
  const snapshot = await adminDb.collection('grupos-pacientes').where('activo', '==', true).get();
  return serializeDocs(snapshot, (data, id) => ({
    id,
    ...data,
    createdAt: dateToISO(data.createdAt),
    updatedAt: dateToISO(data.updatedAt),
  })) as SerializedGrupo[];
}
