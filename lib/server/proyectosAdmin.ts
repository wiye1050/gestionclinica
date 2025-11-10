import { adminDb } from '@/lib/firebaseAdmin';
import type { Proyecto } from '@/types/proyectos';
import { sanitizeHTML, sanitizeInput, sanitizeStringArray } from '@/lib/utils/sanitize';

const assertDb = () => {
  if (!adminDb) throw new Error('Firebase Admin no configurado');
  return adminDb;
};

export async function createProyecto(input: Omit<Proyecto, 'id'>, actor: { uid: string; email?: string | null }) {
  const db = assertDb();
  const now = new Date();
  const cleanInput: Omit<Proyecto, 'id'> = {
    ...input,
    nombre: sanitizeInput(input.nombre),
    descripcion: sanitizeHTML(input.descripcion ?? ''),
    responsableUid: input.responsableUid ? sanitizeInput(input.responsableUid) : '',
    responsableNombre: input.responsableNombre ? sanitizeInput(input.responsableNombre) : '',
    color: input.color ? sanitizeInput(input.color) : '#3b82f6',
    tags: sanitizeStringArray(input.tags ?? []),
  };
  const payload = {
    ...cleanInput,
    createdAt: now,
    updatedAt: now,
    creadoPor: actor.email ?? 'sistema',
    creadoPorId: actor.uid,
  } satisfies Record<string, unknown>;

  const docRef = await db.collection('proyectos').add(payload);
  await db.collection('auditLogs').add({
    modulo: 'proyectos',
    accion: 'create',
    refId: docRef.id,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload,
    createdAt: now,
  });

  return { id: docRef.id };
}

export async function updateProyecto(
  proyectoId: string,
  input: Partial<Proyecto>,
  actor: { uid: string; email?: string | null }
) {
  const db = assertDb();
  const docRef = db.collection('proyectos').doc(proyectoId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El proyecto no existe.');
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date(), modificadoPor: actor.email ?? 'desconocido', modificadoPorId: actor.uid };
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      updateData[key] = key === 'descripcion' ? sanitizeHTML(value) : sanitizeInput(value);
    } else if (key === 'tags' && Array.isArray(value)) {
      updateData[key] = sanitizeStringArray(value as string[]);
    } else {
      updateData[key] = value;
    }
  }
  await docRef.update(updateData);

  await db.collection('auditLogs').add({
    modulo: 'proyectos',
    accion: 'update',
    refId: proyectoId,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload: updateData,
    before: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function deleteProyecto(proyectoId: string, actor: { uid: string; email?: string | null }) {
  const db = assertDb();
  const docRef = db.collection('proyectos').doc(proyectoId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El proyecto no existe.');
  }

  await docRef.delete();

  await db.collection('auditLogs').add({
    modulo: 'proyectos',
    accion: 'delete',
    refId: proyectoId,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}
