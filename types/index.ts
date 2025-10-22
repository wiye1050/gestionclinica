// Tipos para Usuario
export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'coordinador' | 'supervisor' | 'personal';
  activo: boolean;
  createdAt: Date;
}

// Tipos para Reporte Diario
export interface DailyReport {
  id: string;
  fecha: Date;
  turno: 'mañana' | 'tarde' | 'noche';
  incidencias: Incidencia[];
  operaciones: string[];
  notas: string;
  reportadoPor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incidencia {
  tipo: 'operativa' | 'equipamiento' | 'personal' | 'paciente' | 'otro';
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'abierta' | 'en-proceso' | 'resuelta';
  responsable?: string;
}

// Tipos para KPIs
export interface KPI {
  id: string;
  nombre: string;
  categoria: 'calidad' | 'productividad' | 'financiero' | 'satisfaccion';
  valor: number;
  unidad: string;
  objetivo: number;
  fecha: Date;
  tendencia: 'subida' | 'bajada' | 'estable';
}

// Tipos para Tareas y Servicios
export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: number; // en minutos
  protocolo?: Protocolo;
  activo: boolean;
  createdAt: Date;
}

export interface Protocolo {
  pasos: string[];
  materialesNecesarios: string[];
  precauciones: string[];
  tiempoEstimado: number;
}

export interface TareaOperativa {
  id: string;
  titulo: string;
  descripcion: string;
  servicioRelacionado?: string;
  responsable: string;
  estado: 'pendiente' | 'en-proceso' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta';
  fechaLimite?: Date;
  createdAt: Date;
}

// Tipos para Supervisión Clínica
export interface Evaluacion {
  id: string;
  profesionalId: string;
  profesionalNombre: string;
  evaluadorId: string;
  fecha: Date;
  periodo: string;
  areas: AreaEvaluacion[];
  comentarios: string;
  puntuacionGeneral: number;
  createdAt: Date;
}

export interface AreaEvaluacion {
  nombre: string;
  puntuacion: number; // 1-5
  observaciones?: string;
}

// Tipos para Inventario
export interface ItemInventario {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  stockMinimo: number;
  ubicacion: string;
  proveedor?: string;
  ultimaActualizacion: Date;
  estado: 'disponible' | 'bajo-stock' | 'agotado';
}

export interface MovimientoInventario {
  id: string;
  itemId: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo: string;
  responsable: string;
  fecha: Date;
}

// Tipos para Proyectos
export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'planificacion' | 'en-curso' | 'pausado' | 'completado' | 'cancelado';
  prioridad: 'baja' | 'media' | 'alta';
  responsable: string;
  equipo: string[];
  fechaInicio: Date;
  fechaFin?: Date;
  progreso: number; // 0-100
  hitos: Hito[];
  createdAt: Date;
}

export interface Hito {
  nombre: string;
  descripcion: string;
  fechaObjetivo: Date;
  completado: boolean;
  fechaCompletado?: Date;
}

// Tipos para Alertas y Notificaciones
export interface Alerta {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  modulo: string;
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
  usuarioId: string;
}