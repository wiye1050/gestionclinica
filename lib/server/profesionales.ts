import { adminDb } from '@/lib/firebaseAdmin';
import { cached } from '@/lib/server/cache';
import { deserializeProfesionales, type ApiProfesional } from '@/lib/utils/profesionales';

export type SerializedProfesional = ApiProfesional;

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

export async function getSerializedProfesionales(limit = 400): Promise<SerializedProfesional[]> {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[profesionales] Firebase Admin no configurado');
    }
    return [];
  }

  const cappedLimit = Math.min(Math.max(limit, 1), 600);
  return cached(
    ['profesionales', cappedLimit],
    async () => {
      const snapshot = await adminDb
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
export { deserializeProfesionales };
