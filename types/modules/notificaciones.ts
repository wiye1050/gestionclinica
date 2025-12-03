// types/modules/notificaciones.ts

// ============================================
// TIPOS PARA NOTIFICACIONES
// ============================================

export type TipoNotificacion = 'seguimiento' | 'stock' | 'incidencia' | 'protocolo' | 'mejora' | 'agenda' | 'sistema';
export type PrioridadNotificacion = 'alta' | 'media' | 'baja';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  prioridad: PrioridadNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;

  // Enlaces
  url?: string;
  entidadId?: string;
  entidadTipo?: string;

  // Metadata
  destinatarioUid: string;
  createdAt: Date;
  leidaEn?: Date;
}
