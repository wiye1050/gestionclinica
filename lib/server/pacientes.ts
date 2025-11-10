import { adminDb } from '@/lib/firebaseAdmin';
import type { Paciente } from '@/types';
import type { DocumentData } from 'firebase-admin/firestore';

type ConsentimientoSerializable = {
  tipo: string;
  fecha: string;
  documentoId?: string;
  firmadoPor?: string;
};

export type SerializedPaciente = Omit<Paciente, 'fechaNacimiento' | 'createdAt' | 'updatedAt' | 'consentimientos'> & {
  fechaNacimiento: string;
  createdAt: string;
  updatedAt: string;
  consentimientos: ConsentimientoSerializable[];
};

const fallbackDate = new Date('1970-01-01');

const resolveTimestamp = (value: unknown, fallback: Date): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') {
      try {
        return toDate();
      } catch {
        return fallback;
      }
    }
  }
  return fallback;
};

const mapPacienteData = (id: string, raw: DocumentData): Paciente => {
  const fechaNacimiento = resolveTimestamp(raw.fechaNacimiento, fallbackDate);
  const createdAt = resolveTimestamp(raw.createdAt, new Date());
  const updatedAt = resolveTimestamp(raw.updatedAt, new Date());

  const consentimientos = Array.isArray(raw.consentimientos)
    ? raw.consentimientos.map((item: unknown) => {
        const value = item as Record<string, unknown>;
        const fecha = resolveTimestamp(value?.fecha, new Date());
        return {
          tipo: typeof value?.tipo === 'string' ? value.tipo : 'general',
          fecha,
          documentoId: typeof value?.documentoId === 'string' ? value.documentoId : undefined,
          firmadoPor: typeof value?.firmadoPor === 'string' ? value.firmadoPor : undefined,
        };
      })
    : [];

  return {
    id,
    nombre: raw.nombre ?? 'Sin nombre',
    apellidos: raw.apellidos ?? '',
    fechaNacimiento,
    genero: raw.genero ?? 'no-especificado',
    documentoId: raw.documentoId,
    tipoDocumento: raw.tipoDocumento,
    telefono: raw.telefono,
    email: raw.email,
    direccion: raw.direccion,
    ciudad: raw.ciudad,
    codigoPostal: raw.codigoPostal,
    aseguradora: raw.aseguradora,
    numeroPoliza: raw.numeroPoliza,
    alergias: Array.isArray(raw.alergias) ? raw.alergias : [],
    alertasClinicas: Array.isArray(raw.alertasClinicas) ? raw.alertasClinicas : [],
    diagnosticosPrincipales: Array.isArray(raw.diagnosticosPrincipales)
      ? raw.diagnosticosPrincipales
      : [],
    riesgo: raw.riesgo ?? 'medio',
    contactoEmergencia: raw.contactoEmergencia
      ? {
          nombre: raw.contactoEmergencia.nombre ?? '',
          parentesco: raw.contactoEmergencia.parentesco ?? '',
          telefono: raw.contactoEmergencia.telefono ?? '',
        }
      : undefined,
    consentimientos,
    estado: raw.estado ?? 'activo',
    profesionalReferenteId: raw.profesionalReferenteId,
    grupoPacienteId: raw.grupoPacienteId,
    notasInternas: raw.notasInternas,
    creadoPor: raw.creadoPor ?? 'desconocido',
    createdAt,
    updatedAt,
    modificadoPor: raw.modificadoPor,
  } as Paciente;
};

const serializePaciente = (paciente: Paciente): SerializedPaciente => ({
  ...paciente,
  fechaNacimiento: paciente.fechaNacimiento.toISOString(),
  createdAt: paciente.createdAt.toISOString(),
  updatedAt: paciente.updatedAt.toISOString(),
  consentimientos: paciente.consentimientos.map((item) => ({
    tipo: item.tipo,
    fecha: item.fecha.toISOString(),
    documentoId: item.documentoId,
    firmadoPor: item.firmadoPor,
  })),
});

export async function getSerializedPacientes(): Promise<SerializedPaciente[]> {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[pacientes] Firebase Admin no disponible; devolviendo lista vacía.');
    }
    return [];
  }

  const snapshot = await adminDb
    .collection('pacientes')
    .orderBy('apellidos')
    .limit(200)
    .get();

  return snapshot.docs.map((docSnap) => serializePaciente(mapPacienteData(docSnap.id, docSnap.data())));
}

export function deserializePacientes(serialized: SerializedPaciente[]): Paciente[] {
  return serialized.map((item) => ({
    ...item,
    fechaNacimiento: new Date(item.fechaNacimiento),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    consentimientos: item.consentimientos.map((consentimiento) => ({
      ...consentimiento,
      fecha: new Date(consentimiento.fecha),
    })),
  }));
}
