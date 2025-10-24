import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type FollowUpDoc = QueryDocumentSnapshot<DocumentData>;

const RESOLUTION_KEYWORDS = [
  'seguimiento realizado',
  'seguimiento resuelto',
  'seguimiento completado',
  'seguimiento finalizado',
  'seguimiento cerrado',
  'seguimiento sin pendientes',
  'sin seguimiento pendiente',
  'no requiere seguimiento',
  'paciente contactado',
  'contacto completado',
  'contacto efectuado'
];

const hasResolutionKeyword = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.toLowerCase();
  return RESOLUTION_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const extractDate = (data: DocumentData): Date => {
  const rawFecha = data.fecha;
  if (rawFecha instanceof Date) {
    return rawFecha;
  }
  if (rawFecha?.toDate) {
    return rawFecha.toDate();
  }

  const rawCreatedAt = data.createdAt;
  if (rawCreatedAt instanceof Date) {
    return rawCreatedAt;
  }
  if (rawCreatedAt?.toDate) {
    return rawCreatedAt.toDate();
  }

  return new Date(0);
};

const isPlanStillActive = (plan: unknown): plan is string => {
  if (typeof plan !== 'string') {
    return false;
  }
  const trimmed = plan.trim();
  if (trimmed.length === 0) {
    return false;
  }
  return !hasResolutionKeyword(trimmed);
};

const isResolutionEntry = (doc: FollowUpDoc): boolean => {
  const data = doc.data();
  if (hasResolutionKeyword(data.descripcion)) {
    return true;
  }
  if (hasResolutionKeyword(data.resultado)) {
    return true;
  }
  if (hasResolutionKeyword(data.planesSeguimiento)) {
    return true;
  }
  return false;
};

export const getPendingFollowUpPatientIds = async (options?: {
  pendingLimit?: number;
  historyLookupLimit?: number;
}): Promise<Set<string>> => {
  const { pendingLimit = 500, historyLookupLimit = 10 } = options ?? {};
  const historialCollection = collection(db, 'pacientes-historial');

  const pendientesSnap = await getDocs(
    query(
      historialCollection,
      where('planesSeguimiento', '!=', null),
      orderBy('planesSeguimiento'),
      orderBy('fecha', 'desc'),
      limit(pendingLimit)
    )
  );

  const pendientesPorPaciente = new Map<
    string,
    Array<{ id: string; fecha: Date }>
  >();

  pendientesSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const pacienteId = data.pacienteId as string | undefined;
    if (!pacienteId) {
      return;
    }

    const plan = data.planesSeguimiento;
    if (!isPlanStillActive(plan)) {
      return;
    }

    const fecha = extractDate(data);
    const entradas = pendientesPorPaciente.get(pacienteId) ?? [];
    entradas.push({ id: docSnap.id, fecha });
    pendientesPorPaciente.set(pacienteId, entradas);
  });

  if (pendientesPorPaciente.size === 0) {
    return new Set();
  }

  const resultados = await Promise.all(
    Array.from(pendientesPorPaciente.entries()).map(async ([pacienteId, pendientes]) => {
      try {
        const historialPacienteSnap = await getDocs(
          query(
            historialCollection,
            where('pacienteId', '==', pacienteId),
            orderBy('fecha', 'desc'),
            limit(historyLookupLimit)
          )
        );

        const historialDocs = historialPacienteSnap.docs;
        const siguePendiente = pendientes.some((pendiente) => {
          const resuelto = historialDocs.some((docSnap) => {
            if (docSnap.id === pendiente.id) {
              return false;
            }
            const fechaDoc = extractDate(docSnap.data());
            if (fechaDoc <= pendiente.fecha) {
              return false;
            }
            return isResolutionEntry(docSnap);
          });
          return !resuelto;
        });

        return siguePendiente ? pacienteId : null;
      } catch (error) {
        console.error('Error al evaluar seguimientos para paciente', pacienteId, error);
        return pacienteId;
      }
    })
  );

  return new Set(resultados.filter((id): id is string => Boolean(id)));
};

export const hasPendingPlan = (plan: unknown): plan is string => isPlanStillActive(plan);

export const isFollowUpResolution = (data: DocumentData): boolean => {
  if (!data) {
    return false;
  }
  return hasResolutionKeyword(data.descripcion)
    || hasResolutionKeyword(data.resultado)
    || hasResolutionKeyword(data.planesSeguimiento);
};
