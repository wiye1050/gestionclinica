import { adminDb } from '@/lib/firebaseAdmin';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';
import type { SerializedTratamiento, SerializedCatalogoServicio } from '@/lib/utils/tratamientos';

type ServicioIncluidoInput = {
  servicioId: string;
  servicioNombre: string;
  orden: number;
  opcional: boolean;
};

export type TratamientoInput = {
  nombre: string;
  descripcion?: string;
  categoria: 'medicina' | 'fisioterapia' | 'enfermeria' | 'mixto';
  serviciosIncluidos: ServicioIncluidoInput[];
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

export async function getSerializedTratamientos(): Promise<SerializedTratamiento[]> {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[tratamientos] Firebase Admin no configurado.');
    }
    return [];
  }

  const snapshot = await adminDb.collection('tratamientos').orderBy('nombre').get();
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() ?? {};
    return {
      id: docSnap.id,
      nombre: data.nombre ?? 'Sin nombre',
      descripcion: data.descripcion ?? '',
      categoria: data.categoria ?? 'mixto',
      serviciosIncluidos: Array.isArray(data.serviciosIncluidos)
        ? data.serviciosIncluidos.map((servicio: Record<string, unknown>) => ({
            servicioId: typeof servicio.servicioId === 'string' ? servicio.servicioId : String(servicio.servicioId ?? ''),
            servicioNombre: typeof servicio.servicioNombre === 'string' ? servicio.servicioNombre : String(servicio.servicioNombre ?? ''),
            orden: typeof servicio.orden === 'number' ? servicio.orden : Number(servicio.orden ?? 0),
            opcional: Boolean(servicio.opcional),
          }))
        : [],
      tiempoTotalEstimado: Number(data.tiempoTotalEstimado ?? 0),
      activo: Boolean(data.activo),
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    };
  });
}

export async function getSerializedCatalogoServicios(): Promise<SerializedCatalogoServicio[]> {
  if (!adminDb) {
    return [];
  }

  const snapshot = await adminDb.collection('catalogo-servicios').orderBy('nombre').get();
  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data() ?? {};
      return {
        id: docSnap.id,
        nombre: data.nombre ?? 'Sin nombre',
        descripcion: data.descripcion ?? '',
        categoria: data.categoria ?? 'medicina',
        tiempoEstimado: Number(data.tiempoEstimado ?? 0),
        activo: Boolean(data.activo),
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
      } satisfies SerializedCatalogoServicio;
    })
    .filter((servicio) => servicio.activo);
}

const calcularTiempoTotal = async (servicios: ServicioIncluidoInput[]) => {
  if (!adminDb) return 0;
  let total = 0;
  for (const servicio of servicios) {
    const snap = await adminDb.collection('catalogo-servicios').doc(servicio.servicioId).get();
    const data = snap.data() ?? {};
    total += Number(data.tiempoEstimado ?? 0);
  }
  return total;
};

export async function createTratamiento(
  input: TratamientoInput,
  actor: { userId: string; userEmail?: string }
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no configurado');
  }

  if (!Array.isArray(input.serviciosIncluidos) || input.serviciosIncluidos.length === 0) {
    throw new Error('Añade al menos un servicio al tratamiento.');
  }

  const tiempoTotalEstimado = await calcularTiempoTotal(input.serviciosIncluidos);
  const now = new Date();
  const cleanServicios = input.serviciosIncluidos.map((servicio, index) => ({
    ...servicio,
    servicioNombre: sanitizeInput(servicio.servicioNombre),
    orden: servicio.orden ?? index + 1,
  }));

  const payload = {
    ...input,
    nombre: sanitizeInput(input.nombre),
    descripcion: input.descripcion ? sanitizeHTML(input.descripcion) : undefined,
    serviciosIncluidos: cleanServicios,
    tiempoTotalEstimado,
    createdAt: now,
    updatedAt: now,
    creadoPor: actor.userEmail ?? 'desconocido',
    creadoPorId: actor.userId,
  } satisfies Record<string, unknown>;

  const docRef = await adminDb.collection('tratamientos').add(payload);
  await adminDb.collection('auditLogs').add({
    modulo: 'tratamientos',
    accion: 'create',
    refId: docRef.id,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload,
    createdAt: now,
  });

  return { id: docRef.id };
}

export async function updateTratamiento(
  tratamientoId: string,
  input: Partial<TratamientoInput>,
  actor: { userId: string; userEmail?: string }
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no configurado');
  }

  const docRef = adminDb.collection('tratamientos').doc(tratamientoId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El tratamiento no existe.');
  }

  const updateData: Record<string, unknown> = {};
  if (input.nombre !== undefined) updateData.nombre = sanitizeInput(input.nombre);
  if (input.descripcion !== undefined) updateData.descripcion = input.descripcion
    ? sanitizeHTML(input.descripcion)
    : undefined;
  if (input.categoria !== undefined) updateData.categoria = input.categoria;
  if (input.activo !== undefined) updateData.activo = input.activo;

  if (input.serviciosIncluidos) {
    if (!Array.isArray(input.serviciosIncluidos) || input.serviciosIncluidos.length === 0) {
      throw new Error('El tratamiento debe incluir al menos un servicio.');
    }
    const tiempoTotalEstimado = await calcularTiempoTotal(input.serviciosIncluidos);
    updateData.serviciosIncluidos = input.serviciosIncluidos.map((servicio, index) => ({
      ...servicio,
      servicioNombre: sanitizeInput(servicio.servicioNombre),
      orden: servicio.orden ?? index + 1,
    }));
    updateData.tiempoTotalEstimado = tiempoTotalEstimado;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No se enviaron cambios.');
  }

  updateData.updatedAt = new Date();
  updateData.modificadoPor = actor.userEmail ?? 'desconocido';
  updateData.modificadoPorId = actor.userId;

  await docRef.update(updateData);

  await adminDb.collection('auditLogs').add({
    modulo: 'tratamientos',
    accion: 'update',
    refId: tratamientoId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: updateData,
    before: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function deleteTratamiento(tratamientoId: string, actor: { userId: string; userEmail?: string }) {
  if (!adminDb) {
    throw new Error('Firebase Admin no configurado');
  }

  const docRef = adminDb.collection('tratamientos').doc(tratamientoId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El tratamiento no existe.');
  }

  await docRef.delete();

  await adminDb.collection('auditLogs').add({
    modulo: 'tratamientos',
    accion: 'delete',
    refId: tratamientoId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}
