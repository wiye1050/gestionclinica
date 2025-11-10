import { logAuditServer } from '@/lib/utils/auditServer';

export interface AuditLogPayload {
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
  await logAuditServer(payload);
};
