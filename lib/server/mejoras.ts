import { adminDb } from '@/lib/firebaseAdmin';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';

const assertDb = () => {
  if (!adminDb) throw new Error('Firebase Admin no configurado');
  return adminDb;
};

export type MejoraPayload = {
  titulo: string;
  descripcion?: string;
  area: string;
  responsableUid?: string;
  responsableNombre?: string;
  rice: { reach: number; impact: number; confidence: number; effort: number; score: number };
};

const stripUndefined = <T extends Record<string, unknown>>(data: T): T =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;

export async function createMejora(payload: MejoraPayload, actor: { uid: string; email?: string | null }) {
  const db = assertDb();
  const now = new Date();
  const cleanPayload: MejoraPayload = {
    ...payload,
    titulo: sanitizeInput(payload.titulo),
    descripcion: payload.descripcion ? sanitizeHTML(payload.descripcion) : undefined,
    area: sanitizeInput(payload.area),
    responsableUid: payload.responsableUid ? sanitizeInput(payload.responsableUid) : undefined,
    responsableNombre: payload.responsableNombre ? sanitizeInput(payload.responsableNombre) : undefined,
  };
  const firestorePayload = stripUndefined(cleanPayload);
  const docRef = await db.collection('mejoras').add({
    ...firestorePayload,
    estado: 'idea',
    evidenciasCount: 0,
    creadoPor: actor.uid,
    creadoPorNombre: actor.email ?? 'sistema',
    createdAt: now,
    updatedAt: now,
  });

  await db.collection('auditLogs').add({
    modulo: 'mejoras',
    accion: 'create',
    refId: docRef.id,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload: firestorePayload,
    createdAt: now,
  });

  return { id: docRef.id };
}

export async function updateMejoraEstado(
  mejoraId: string,
  estado: string,
  actor: { uid: string; email?: string | null }
) {
  const db = assertDb();
  const docRef = db.collection('mejoras').doc(mejoraId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('La mejora no existe.');
  }

  await docRef.update({ estado, updatedAt: new Date() });

  await db.collection('auditLogs').add({
    modulo: 'mejoras',
    accion: 'update-estado',
    refId: mejoraId,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload: { estado },
    before: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function agregarEvidencia(
  data: { mejoraId: string; tipo: string; url?: string; descripcion?: string },
  actor: { uid: string; email?: string | null }
) {
  const db = assertDb();
  const cleanEvidencia = {
    mejoraId: sanitizeInput(data.mejoraId),
    tipo: sanitizeInput(data.tipo),
    url: data.url ? sanitizeInput(data.url) : undefined,
    descripcion: data.descripcion ? sanitizeHTML(data.descripcion) : undefined,
  };
  await db.collection('mejoras-evidencias').add({
    ...cleanEvidencia,
    autorUid: actor.uid,
    autorNombre: actor.email ?? 'sistema',
    createdAt: new Date(),
  });

  await db.collection('auditLogs').add({
    modulo: 'mejoras',
    accion: 'agregar-evidencia',
    refId: data.mejoraId,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload: cleanEvidencia,
    createdAt: new Date(),
  });
}
