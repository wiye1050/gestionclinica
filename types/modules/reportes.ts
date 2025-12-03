// types/modules/reportes.ts

// ============================================
// TIPOS PARA REPORTE DIARIO
// ============================================

export interface CambioEstado {
  estadoAnterior: 'pendiente' | 'en-proceso' | 'resuelta';
  estadoNuevo: 'pendiente' | 'en-proceso' | 'resuelta';
  fecha: Date;
  usuario: string;
  comentario?: string;
}

export interface DailyReport {
  id: string;
  fecha: Date;
  hora: string;
  tipo: 'incidencia' | 'mejora' | 'operacion' | 'nota';
  categoria: 'personal' | 'material-sala' | 'servicio' | 'paciente' | 'software';
  prioridad: 'baja' | 'media' | 'alta';
  responsable: 'direccion' | 'administracion' | 'coordinacion';
  descripcion: string;
  estado: 'pendiente' | 'en-proceso' | 'resuelta';
  observaciones?: string;

  personasInvolucradas?: string[];
  accionInmediata?: string;
  requiereSeguimiento: boolean;
  fechaLimite?: Date;
  adjuntos?: string[];
  tags?: string[];

  historialEstados?: CambioEstado[];
  resolucion?: string;
  fechaResolucion?: Date;

  reportadoPor: string;
  reportadoPorId: string;
  reportadoPorNombre?: string;
  createdAt: Date;
  updatedAt: Date;
  modificadoPor?: string;
}

export interface EstadisticasReporte {
  totalReportes: number;
  porTipo: Record<string, number>;
  porCategoria: Record<string, number>;
  porPrioridad: Record<string, number>;
  porEstado: Record<string, number>;
  pendientesAlta: number;
  promedioResolucion: number;
}
