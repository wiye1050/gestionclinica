// types/index.ts - TIPOS ACTUALIZADOS PARA PROYECTOS

// ... (mantener todos los tipos existentes)

// ============================================
// TIPOS PARA GESTIÓN DE PROYECTOS (ACTUALIZADO)
// ============================================

export type TipoProyecto = 'desarrollo' | 'operacional' | 'investigacion' | 'marketing' | 'mejora' | 'infraestructura';
export type EstadoProyecto = 'propuesta' | 'planificacion' | 'en-curso' | 'pausado' | 'completado' | 'cancelado';
export type PrioridadProyecto = 'critica' | 'alta' | 'media' | 'baja';

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoProyecto;
  categoria?: string;
  estado: EstadoProyecto;
  prioridad: PrioridadProyecto;
  
  // Responsables
  responsableUid: string;
  responsableNombre: string;
  equipo?: Array<{
    uid: string;
    nombre: string;
    rol: string;
  }>;
  
  // Fechas
  fechaInicio?: Date;
  fechaFinEstimada?: Date;
  fechaFinReal?: Date;
  
  // Progreso
  progreso: number;
  hitos: ProyectoHito[];
  
  // Recursos
  presupuesto?: number;
  presupuestoGastado?: number;
  horasEstimadas?: number;
  horasReales?: number;
  
  // Enlaces
  enlaces?: Array<{
    titulo: string;
    url: string;
    tipo: 'documento' | 'repositorio' | 'diseño' | 'otro';
  }>;
  
  // Dependencias
  dependeDe?: string[];
  bloqueaA?: string[];
  
  // Etiquetas
  tags?: string[];
  color?: string;
  
  // Seguimiento
  actualizaciones: ProyectoActualizacion[];
  tareas: ProyectoTarea[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  creadoPorNombre?: string;
  modificadoPor?: string;
  archivedAt?: Date;
}

export interface ProyectoHito {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaObjetivo: Date;
  fechaCompletado?: Date;
  completado: boolean;
  orden: number;
}

export interface ProyectoActualizacion {
  id: string;
  fecha: Date;
  texto: string;
  tipo: 'progreso' | 'bloqueador' | 'hito' | 'nota';
  autor: string;
  autorNombre?: string;
}

export interface ProyectoTarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: 'pendiente' | 'en-curso' | 'bloqueada' | 'completada';
  prioridad: 'alta' | 'media' | 'baja';
  asignadoA?: string;
  asignadoNombre?: string;
  fechaLimite?: Date;
  completadaEn?: Date;
  estimacionHoras?: number;
  horasReales?: number;
  tags?: string[];
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstadisticasProyectos {
  totalProyectos: number;
  porEstado: Record<EstadoProyecto, number>;
  porTipo: Record<TipoProyecto, number>;
  porPrioridad: Record<PrioridadProyecto, number>;
  progresoPromedio: number;
  proyectosAtrasados: number;
  proyectosEnRiesgo: number;
  tareasCompletadasSemana: number;
  horasTotales: number;
  presupuestoTotal: number;
}
