import { adminDb } from '@/lib/firebaseAdmin';
import type { DailyReport } from '@/types';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';

const stripUndefined = <T extends Record<string, unknown>>(data: T): T =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;

export type SerializedDailyReport = {
  id: string;
  tipo: DailyReport['tipo'];
  categoria: DailyReport['categoria'];
  prioridad: DailyReport['prioridad'];
  responsable: DailyReport['responsable'];
  descripcion: string;
  accionInmediata?: string;
  requiereSeguimiento: boolean;
  estado: DailyReport['estado'];
  reportadoPor: string;
  reportadoPorId: string;
  createdAt?: string;
  updatedAt?: string;
  fecha?: string;
};

export type CreateDailyReportInput = {
  tipo: DailyReport['tipo'];
  categoria: DailyReport['categoria'];
  prioridad: DailyReport['prioridad'];
  responsable: DailyReport['responsable'];
  descripcion: string;
  accionInmediata?: string;
  requiereSeguimiento: boolean;
  reportadoPor: string;
  reportadoPorId: string;
  fecha?: string;
  hora?: string;
};

export type UpdateDailyReportInput = Partial<
  Pick<
    DailyReport,
    'tipo' | 'categoria' | 'prioridad' | 'responsable' | 'descripcion' | 'accionInmediata' | 'requiereSeguimiento' | 'estado'
  >
> & { fecha?: string; hora?: string };

const toISOString = (value: unknown): string | undefined => {
  if (value instanceof Date) {
    return value.toISOString();
  }
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

export async function getSerializedDailyReports(limit = 200): Promise<SerializedDailyReport[]> {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[reports] Firebase Admin no configurado, devolviendo lista vacía');
    }
    return [];
  }

  const snapshot = await adminDb
    .collection('reportes-diarios')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() ?? {};
    return {
      id: docSnap.id,
      tipo: data.tipo ?? 'incidencia',
      categoria: data.categoria ?? 'personal',
      prioridad: data.prioridad ?? 'media',
      responsable: data.responsable ?? 'coordinacion',
      descripcion: data.descripcion ?? '',
      accionInmediata: data.accionInmediata ?? '',
      requiereSeguimiento: Boolean(data.requiereSeguimiento),
      estado: data.estado ?? 'pendiente',
      reportadoPor: data.reportadoPor ?? 'sistema',
      reportadoPorId: data.reportadoPorId ?? 'sistema',
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
      fecha: toISOString(data.fecha),
    };
  });
}

export async function createDailyReport(input: CreateDailyReportInput) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const now = new Date();
  const fecha = input.fecha ? new Date(input.fecha) : now;
  if (Number.isNaN(fecha.getTime())) {
    throw new Error('La fecha indicada no es válida.');
  }

  const hora = input.hora ?? `${fecha.getHours().toString().padStart(2, '0')}:${fecha
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const payload = stripUndefined({
    tipo: sanitizeInput(input.tipo),
    categoria: sanitizeInput(input.categoria),
    prioridad: sanitizeInput(input.prioridad),
    responsable: sanitizeInput(input.responsable),
    descripcion: sanitizeHTML(input.descripcion),
    accionInmediata: input.accionInmediata ? sanitizeHTML(input.accionInmediata) : '',
    requiereSeguimiento: Boolean(input.requiereSeguimiento),
    estado: 'pendiente',
    reportadoPor: sanitizeInput(input.reportadoPor),
    reportadoPorId: input.reportadoPorId,
    fecha,
    hora,
    createdAt: now,
    updatedAt: now,
    historialEstados: [
      {
        estadoAnterior: 'pendiente',
        estadoNuevo: 'pendiente',
        fecha: now,
        usuario: sanitizeInput(input.reportadoPor),
        comentario: 'Reporte creado',
      },
    ],
  });

  const docRef = await adminDb.collection('reportes-diarios').add(payload);
  await adminDb.collection('auditLogs').add({
    modulo: 'reportes-diarios',
    accion: 'create',
    refId: docRef.id,
    userId: input.reportadoPorId,
    userEmail: input.reportadoPor,
    payload,
    createdAt: now,
  });

  return { id: docRef.id };
}

export async function updateDailyReport(
  reportId: string,
  changes: UpdateDailyReportInput,
  actor: { userId: string; userEmail?: string }
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('reportes-diarios').doc(reportId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El reporte no existe.');
  }

  const current = snapshot.data() ?? {};
  const updateData: Record<string, unknown> = {};

  const fields: Array<keyof UpdateDailyReportInput> = [
    'tipo',
    'categoria',
    'prioridad',
    'responsable',
    'descripcion',
    'accionInmediata',
    'requiereSeguimiento',
  ];
  for (const field of fields) {
    if (changes[field] !== undefined) {
      const value = changes[field];
      if (typeof value === 'string') {
        updateData[field] = field === 'descripcion' || field === 'accionInmediata'
          ? sanitizeHTML(value)
          : sanitizeInput(value);
      } else {
        updateData[field] = value;
      }
    }
  }

  if (changes.fecha) {
    const nuevaFecha = new Date(changes.fecha);
    if (Number.isNaN(nuevaFecha.getTime())) {
      throw new Error('La fecha indicada no es válida.');
    }
    updateData.fecha = nuevaFecha;
  }
  if (changes.hora) {
    updateData.hora = changes.hora;
  }

  if (changes.estado && changes.estado !== current.estado) {
    updateData.estado = changes.estado;
    const historial = Array.isArray(current.historialEstados) ? current.historialEstados : [];
    historial.push({
      estadoAnterior: current.estado ?? 'pendiente',
      estadoNuevo: changes.estado,
      fecha: new Date(),
      usuario: actor.userEmail ?? 'sistema',
      comentario: 'Actualización manual',
    });
    updateData.historialEstados = historial;
    if (changes.estado === 'resuelta') {
      updateData.fechaResolucion = new Date();
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No se enviaron cambios para el reporte.');
  }

  updateData.updatedAt = new Date();
  updateData.modificadoPor = actor.userEmail ?? 'desconocido';
  updateData.modificadoPorId = actor.userId;

  const cleanUpdate = stripUndefined(updateData);

  await docRef.update(cleanUpdate);

  await adminDb.collection('auditLogs').add({
    modulo: 'reportes-diarios',
    accion: 'update',
    refId: reportId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: cleanUpdate,
    before: current,
    createdAt: new Date(),
  });
}

export async function deleteDailyReport(reportId: string, actor: { userId: string; userEmail?: string }) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('reportes-diarios').doc(reportId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El reporte no existe.');
  }

  await docRef.delete();
  await adminDb.collection('auditLogs').add({
    modulo: 'reportes-diarios',
    accion: 'delete',
    refId: reportId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}
