import { adminDb } from '@/lib/firebaseAdmin';

interface AuditLogPayload {
  actorUid: string;
  actorNombre?: string;
  modulo: string;
  accion: string;
  entidadId: string;
  entidadTipo?: string;
  rutaDetalle?: string;
  resumen?: string;
  detalles?: Record<string, unknown>;
}

export const logAuditServer = async (payload: AuditLogPayload) => {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[audit] Firebase Admin no configurado; se omite auditoría.');
    }
    return;
  }

  try {
    await adminDb.collection('auditLogs').add({
      ...payload,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error registrando auditoría (server)', error);
  }
};
