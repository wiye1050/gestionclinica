import { adminDb } from '@/lib/firebaseAdmin';
import { sanitizeHTML, sanitizeStringArray, sanitizeText } from '@/lib/utils/sanitize';

export type CatalogoServicioInput = {
  nombre: string;
  categoria: 'medicina' | 'fisioterapia' | 'enfermeria';
  descripcion?: string;
  tiempoEstimado: number;
  requiereSala: boolean;
  salaPredeterminada?: string;
  requiereSupervision: boolean;
  requiereApoyo: boolean;
  frecuenciaMensual?: number;
  cargaMensualEstimada?: string;
  profesionalesHabilitados: string[];
  activo: boolean;
};

const assertDb = () => {
  if (!adminDb) throw new Error('Firebase Admin no configurado');
  return adminDb;
};

export async function createCatalogoServicio(
  input: CatalogoServicioInput,
  actor: { userId: string; userEmail?: string }
) {
  const db = assertDb();
  const now = new Date();
  const cleanInput: CatalogoServicioInput = {
    ...input,
    nombre: sanitizeText(input.nombre, ''),
    descripcion: input.descripcion ? sanitizeHTML(input.descripcion) : undefined,
    salaPredeterminada: input.salaPredeterminada ? sanitizeText(input.salaPredeterminada, '') : undefined,
    cargaMensualEstimada: input.cargaMensualEstimada ? sanitizeText(input.cargaMensualEstimada, '') : undefined,
    profesionalesHabilitados: sanitizeStringArray(input.profesionalesHabilitados),
  };
  const payload = {
    ...cleanInput,
    createdAt: now,
    updatedAt: now,
    creadoPor: actor.userEmail ?? 'sistema',
    creadoPorId: actor.userId,
  } satisfies Record<string, unknown>;

  const docRef = await db.collection('catalogo-servicios').add(payload);
  await db.collection('auditLogs').add({
    modulo: 'catalogo-servicios',
    accion: 'create',
    refId: docRef.id,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload,
    createdAt: now,
  });

  return { id: docRef.id };
}

export async function updateCatalogoServicio(
  servicioId: string,
  input: Partial<CatalogoServicioInput>,
  actor: { userId: string; userEmail?: string }
) {
  const db = assertDb();
  const docRef = db.collection('catalogo-servicios').doc(servicioId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El servicio del catálogo no existe.');
  }

  const updateData: Record<string, unknown> = {};
  for (const key of Object.keys(input) as Array<keyof CatalogoServicioInput>) {
    if (input[key] !== undefined) {
      const value = input[key];
      if (typeof value === 'string' && key !== 'categoria') {
        updateData[key] = key === 'descripcion' ? sanitizeHTML(value) : sanitizeText(value, '');
      } else if (Array.isArray(value) && key === 'profesionalesHabilitados') {
        updateData[key] = sanitizeStringArray(value);
      } else {
        updateData[key] = value;
      }
    }
  }
  if (Object.keys(updateData).length === 0) {
    throw new Error('No se enviaron cambios.');
  }

  updateData.updatedAt = new Date();
  updateData.modificadoPor = actor.userEmail ?? 'desconocido';
  updateData.modificadoPorId = actor.userId;

  await docRef.update(updateData);

  await db.collection('auditLogs').add({
    modulo: 'catalogo-servicios',
    accion: 'update',
    refId: servicioId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: updateData,
    before: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function deleteCatalogoServicio(
  servicioId: string,
  actor: { userId: string; userEmail?: string }
) {
  const db = assertDb();
  const docRef = db.collection('catalogo-servicios').doc(servicioId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El servicio del catálogo no existe.');
  }

  await docRef.delete();

  await db.collection('auditLogs').add({
    modulo: 'catalogo-servicios',
    accion: 'delete',
    refId: servicioId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}
