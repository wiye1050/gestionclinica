import { adminDb } from '@/lib/firebaseAdmin';
import { sanitizeRichText, sanitizeStringArray, sanitizeText } from '@/lib/utils/sanitize';

export function normalizeCommaList(value?: string | string[] | null) {
  if (!value) return [] as string[];
  if (Array.isArray(value)) {
    return sanitizeStringArray(
      value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    );
  }
  if (typeof value === 'string') {
    return sanitizeStringArray(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }
  return [];
}

export const buildPacientePayload = (
  values: Record<string, unknown>,
  user: { email?: string | null; uid: string }
) => {
  const ahora = new Date();
  const alergias = normalizeCommaList(values.alergias as string);
  const alertasClinicas = normalizeCommaList(values.alertasClinicas as string);
  const diagnosticosPrincipales = normalizeCommaList(values.diagnosticosPrincipales as string);

  return {
    nombre: sanitizeText(values.nombre, ''),
    apellidos: sanitizeText(values.apellidos, ''),
    fechaNacimiento: values.fechaNacimiento ? new Date(String(values.fechaNacimiento)) : null,
    genero: values.genero,
    documentoId: values.documentoId ? sanitizeText(values.documentoId, '') : null,
    tipoDocumento: values.tipoDocumento ? sanitizeText(values.tipoDocumento, '') : null,
    telefono: values.telefono ? sanitizeText(values.telefono, '') : null,
    email: values.email ? sanitizeText(values.email, '') : null,
    direccion: values.direccion ? sanitizeText(values.direccion, '') : null,
    ciudad: values.ciudad ? sanitizeText(values.ciudad, '') : null,
    codigoPostal: values.codigoPostal ? sanitizeText(values.codigoPostal, '') : null,
    aseguradora: values.aseguradora ? sanitizeText(values.aseguradora, '') : null,
    numeroPoliza: values.numeroPoliza ? sanitizeText(values.numeroPoliza, '') : null,
    alergias,
    alertasClinicas,
    diagnosticosPrincipales,
    riesgo: values.riesgo,
    estado: values.estado,
    profesionalReferenteId: values.profesionalReferenteId ? sanitizeText(values.profesionalReferenteId, '') : null,
    notasInternas: values.notasInternas ? sanitizeRichText(values.notasInternas, '') : null,
    contactoEmergencia: values.contactoEmergenciaNombre
      ? {
          nombre: sanitizeText(values.contactoEmergenciaNombre, ''),
          parentesco: values.contactoEmergenciaParentesco
            ? sanitizeText(values.contactoEmergenciaParentesco, '')
            : '',
          telefono: values.contactoEmergenciaTelefono
            ? sanitizeText(values.contactoEmergenciaTelefono, '')
            : '',
        }
      : null,
    consentimientos: [],
    createdAt: ahora,
    updatedAt: ahora,
    creadoPor: user.email ?? user.uid,
    creadoPorId: user.uid,
  } as Record<string, unknown>;
};

export async function createPaciente(values: Record<string, unknown>, user: { email?: string | null; uid: string }) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const payload = buildPacientePayload(values, user);
  const docRef = await adminDb.collection('pacientes').add(payload);

  await adminDb.collection('pacientes-historial').add({
    pacienteId: docRef.id,
    eventoAgendaId: null,
    servicioId: null,
    servicioNombre: null,
    profesionalId: values.profesionalReferenteId || null,
    profesionalNombre: values.profesionalReferenteNombre || null,
    fecha: new Date(),
    tipo: 'seguimiento',
    descripcion: 'Ficha de paciente creada en el sistema.',
    resultado: null,
    planesSeguimiento: null,
    adjuntos: [],
    createdAt: new Date(),
    creadoPor: user.email ?? user.uid,
  });

  await adminDb.collection('auditLogs').add({
    modulo: 'pacientes',
    accion: 'create',
    refId: docRef.id,
    userId: user.uid,
    userEmail: user.email ?? undefined,
    payload,
    createdAt: new Date(),
  });

  return { id: docRef.id };
}

export async function updatePaciente(
  pacienteId: string,
  values: Record<string, unknown>,
  user: { email?: string | null; uid: string }
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('pacientes').doc(pacienteId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El paciente no existe.');
  }

  const payload = buildPacientePayload(values, user);
  payload.createdAt = snapshot.data()?.createdAt ?? new Date();
  payload.updatedAt = new Date();
  payload.creadoPor = snapshot.data()?.creadoPor ?? user.email ?? user.uid;
  payload.creadoPorId = snapshot.data()?.creadoPorId ?? user.uid;

  await docRef.set(payload);

  await adminDb.collection('pacientes-historial').add({
    pacienteId,
    eventoAgendaId: null,
    servicioId: null,
    servicioNombre: null,
    profesionalId: values.profesionalReferenteId || null,
    profesionalNombre: values.profesionalReferenteNombre || null,
    fecha: new Date(),
    tipo: 'seguimiento',
    descripcion: 'Datos del paciente actualizados desde la ficha clínica.',
    resultado: null,
    planesSeguimiento: null,
    adjuntos: [],
    createdAt: new Date(),
    creadoPor: user.email ?? user.uid,
  });

  await adminDb.collection('auditLogs').add({
    modulo: 'pacientes',
    accion: 'update',
    refId: pacienteId,
    userId: user.uid,
    userEmail: user.email ?? undefined,
    payload,
    before: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function deletePaciente(
  pacienteId: string,
  user: { email?: string | null; uid: string }
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('pacientes').doc(pacienteId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El paciente no existe.');
  }

  await docRef.delete();

  await adminDb.collection('auditLogs').add({
    modulo: 'pacientes',
    accion: 'delete',
    refId: pacienteId,
    userId: user.uid,
    userEmail: user.email ?? undefined,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function addPacienteHistorial(
  pacienteId: string,
  data: {
    tipo: string;
    descripcion: string;
    profesionalId?: string | null;
    profesionalNombre?: string | null;
    adjuntos?: string[];
    planesSeguimiento?: string | null;
  },
  user: { email?: string | null; uid: string }
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  await adminDb.collection('pacientes-historial').add({
    pacienteId,
    eventoAgendaId: null,
    servicioId: null,
    servicioNombre: null,
    profesionalId: data.profesionalId ?? null,
    profesionalNombre: data.profesionalNombre ?? null,
    fecha: new Date(),
    tipo: data.tipo,
    descripcion: data.descripcion,
    resultado: null,
    planesSeguimiento: data.planesSeguimiento ?? null,
    adjuntos: data.adjuntos ?? [],
    createdAt: new Date(),
    creadoPor: user.email ?? user.uid,
  });
}
