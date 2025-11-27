import { adminDb } from '@/lib/firebaseAdmin';
import { cached } from '@/lib/server/cache';
import { deserializeProfesionales, type ApiProfesional } from '@/lib/utils/profesionales';
import { sanitizeStringArray, sanitizeText } from '@/lib/utils/sanitize';

export type SerializedProfesional = ApiProfesional;
export type ProfesionalInput = {
  nombre: string;
  apellidos: string;
  especialidad: 'medicina' | 'fisioterapia' | 'enfermeria';
  email: string;
  telefono?: string;
  horasSemanales: number;
  diasTrabajo: string[];
  horaInicio: string;
  horaFin: string;
  activo: boolean;
};

const toISO = (value: unknown): string | undefined => {
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

const assertAdminDb = () => {
  if (!adminDb) throw new Error('Firebase Admin no configurado');
  return adminDb;
};

export async function createProfesional(
  input: ProfesionalInput,
  actor: { userId: string; userEmail?: string }
) {
  const db = assertAdminDb();
  const now = new Date();
  const cleanInput: ProfesionalInput = {
    ...input,
    nombre: sanitizeText(input.nombre, ''),
    apellidos: sanitizeText(input.apellidos, ''),
    email: sanitizeText(input.email, ''),
    telefono: input.telefono ? sanitizeText(input.telefono, '') : undefined,
    diasTrabajo: sanitizeStringArray(input.diasTrabajo),
    horaInicio: sanitizeText(input.horaInicio, ''),
    horaFin: sanitizeText(input.horaFin, ''),
  };
  const payload = {
    ...cleanInput,
    serviciosAsignados: 0,
    cargaTrabajo: 0,
    createdAt: now,
    updatedAt: now,
    creadoPor: actor.userEmail ?? 'sistema',
    creadoPorId: actor.userId,
  } satisfies Record<string, unknown>;

  const docRef = await db.collection('profesionales').add(payload);
  await db.collection('auditLogs').add({
    modulo: 'profesionales',
    accion: 'create',
    refId: docRef.id,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload,
    createdAt: now,
  });

  return { id: docRef.id };
}

export async function getSerializedProfesionales(limit = 400): Promise<SerializedProfesional[]> {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[profesionales] Firebase Admin no configurado');
    }
    return [];
  }

  const db = assertAdminDb();
  const cappedLimit = Math.min(Math.max(limit, 1), 600);
  return cached(
    ['profesionales', cappedLimit],
    async () => {
      const snapshot = await db
        .collection('profesionales')
        .orderBy('apellidos')
        .limit(cappedLimit)
        .get();

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() ?? {};
        return {
          id: docSnap.id,
          nombre: data.nombre ?? 'Sin nombre',
          apellidos: data.apellidos ?? '',
          especialidad: data.especialidad ?? 'medicina',
          email: data.email ?? '',
          telefono: data.telefono ?? '',
          activo: data.activo ?? true,
          horasSemanales: data.horasSemanales ?? 40,
          diasTrabajo: Array.isArray(data.diasTrabajo) ? data.diasTrabajo : [],
          horaInicio: data.horaInicio ?? '08:00',
          horaFin: data.horaFin ?? '16:00',
          serviciosAsignados: data.serviciosAsignados ?? 0,
          cargaTrabajo: data.cargaTrabajo ?? 0,
          createdAt: toISO(data.createdAt),
          updatedAt: toISO(data.updatedAt),
          color: data.color ?? undefined,
        } satisfies SerializedProfesional;
      });
    },
    { revalidate: 120, tags: ['profesionales'] }
  );
}

export async function updateProfesional(
  profesionalId: string,
  input: Partial<ProfesionalInput>,
  actor: { userId: string; userEmail?: string }
) {
  const db = assertAdminDb();
  const docRef = db.collection('profesionales').doc(profesionalId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El profesional no existe.');
  }

  const updateData: Record<string, unknown> = {};
  for (const key of Object.keys(input) as Array<keyof ProfesionalInput>) {
    if (input[key] !== undefined) {
      const value = input[key];
      if (typeof value === 'string') {
        updateData[key] = sanitizeText(value, '');
      } else if (key === 'diasTrabajo' && Array.isArray(value)) {
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
    modulo: 'profesionales',
    accion: 'update',
    refId: profesionalId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: updateData,
    before: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function deleteProfesional(
  profesionalId: string,
  actor: { userId: string; userEmail?: string }
) {
  const db = assertAdminDb();
  const docRef = db.collection('profesionales').doc(profesionalId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El profesional no existe.');
  }

  await docRef.delete();

  await db.collection('auditLogs').add({
    modulo: 'profesionales',
    accion: 'delete',
    refId: profesionalId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}

export { deserializeProfesionales };
