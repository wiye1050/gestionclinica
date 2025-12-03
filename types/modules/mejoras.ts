// types/modules/mejoras.ts

// ============================================
// TIPOS PARA MEJORAS CONTINUAS
// ============================================

export type MejoraEstado = 'idea' | 'en-analisis' | 'planificada' | 'en-progreso' | 'completada';
export type MejoraArea = 'salas' | 'equipos' | 'procedimientos' | 'software' | 'comunicacion' | 'otro';

export interface MejoraRICE {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
}

export interface Mejora {
  id: string;
  titulo: string;
  descripcion: string;
  area: MejoraArea;
  estado: MejoraEstado;
  responsableUid?: string;
  responsableNombre?: string;
  rice: MejoraRICE;
  evidenciasCount: number;
  creadoPor: string;
  creadoPorNombre?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MejoraEvidencia {
  id: string;
  mejoraId: string;
  autorUid: string;
  autorNombre?: string;
  tipo: 'imagen' | 'documento' | 'enlace' | 'texto';
  url?: string;
  descripcion?: string;
  createdAt: Date;
}

export interface MejoraTarea {
  id: string;
  mejoraId: string;
  titulo: string;
  estado: 'pendiente' | 'en-curso' | 'hecho';
  responsableUid?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
