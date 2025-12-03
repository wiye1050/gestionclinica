// types/modules/protocolos.ts

// ============================================
// TIPOS PARA PROTOCOLOS CLÍNICOS
// ============================================

export type ProtocolArea = 'medicina' | 'fisioterapia' | 'enfermeria' | 'administracion' | 'marketing' | 'operaciones';
export type ProtocolStatus = 'borrador' | 'revision' | 'publicado' | 'retirado';

export interface Protocolo {
  id: string;
  titulo: string;
  area: ProtocolArea;
  estado: ProtocolStatus;
  descripcion?: string;
  ultimaVersionId?: string;
  requiereQuiz: boolean;
  visiblePara: Array<'admin' | 'coordinacion' | 'terapeuta' | 'admin_ops' | 'marketing' | 'invitado'>;
  checklistBasica?: string[];
  creadoPor: string;
  creadoPorNombre?: string;
  createdAt: Date;
  updatedAt: Date;
  modificadoPor?: string;
}

export interface ProtocoloVersion {
  id: string;
  protocoloId: string;
  version: number;
  titulo: string;
  contenido: string;
  checklist: Array<{ item: string; requerido: boolean }>;
  guionComunicacion?: string;
  anexos?: Array<{ nombre: string; url: string }>;
  quiz?: {
    preguntas: Array<{ pregunta: string; opciones: string[]; respuestaCorrecta: number }>;
  };
  codigoQrUrl?: string;
  aprobado: boolean;
  aprobadoPorUid?: string;
  aprobadoPorNombre?: string;
  aprobadoEn?: Date;
  createdAt: Date;
  createdPor: string;
}

export interface ProtocoloLectura {
  id: string;
  protocoloId: string;
  version: number;
  usuarioUid: string;
  usuarioNombre?: string;
  resultadoQuiz?: number;
  aprobadoQuiz?: boolean;
  checklistConfirmada: boolean;
  leidoEn: Date;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorNombre?: string;
  modulo: 'protocolos' | 'mejoras' | 'agenda' | 'pacientes' | string;
  accion: string;
  entidadId: string;
  entidadTipo?: string;
  rutaDetalle?: string;
  resumen?: string;
  detalles?: Record<string, unknown>;
  createdAt: Date;
}
