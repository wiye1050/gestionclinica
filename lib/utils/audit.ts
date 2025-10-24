import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export const logAudit = async (payload: AuditLogPayload) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      ...payload,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error registrando auditoría', error);
  }
};
