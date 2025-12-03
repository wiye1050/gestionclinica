// types/modules/servicios.ts

// ============================================
// TIPOS PARA GESTIÓN DE SERVICIOS Y TAREAS
// ============================================

// Profesionales de la clínica
export interface Profesional {
  id: string;
  nombre: string;
  apellidos: string;
  especialidad: 'medicina' | 'fisioterapia' | 'enfermeria';
  /** Color identificativo en formato hexadecimal (ej: "#3B82F6"). Usado en agenda y vistas multi-profesional */
  color?: string;
  email: string;
  telefono?: string;
  activo: boolean;

  // Disponibilidad y capacidad
  horasSemanales: number;
  diasTrabajo: string[];
  horaInicio: string;
  horaFin: string;

  // Estadísticas
  serviciosAsignados: number;
  cargaTrabajo: number;

  createdAt: Date;
  updatedAt: Date;
}

// Grupos de pacientes
export interface GrupoPaciente {
  id: string;
  nombre: string;
  pacientes: string[];
  color: string;
  activo: boolean;

  // Profesionales asignados por defecto
  medicinaPrincipal?: string;
  fisioterapiaPrincipal?: string;
  enfermeriaPrincipal?: string;

  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Catálogo de Servicios (plantillas)
export interface CatalogoServicio {
  id: string;
  nombre: string;
  categoria: 'medicina' | 'fisioterapia' | 'enfermeria';
  /** Color del servicio en formato hexadecimal (ej: "#10B981"). Se aplica a eventos de agenda de este servicio */
  color: string;
  descripcion?: string;
  protocolosRequeridos?: string[];

  // Configuración del servicio
  tiempoEstimado: number;
  requiereSala: boolean;
  salaPredeterminada?: string;
  requiereSupervision: boolean;
  requiereApoyo: boolean;

  // Para cálculos
  frecuenciaMensual?: number;
  cargaMensualEstimada?: string;

  // Profesionales que pueden realizar este servicio
  profesionalesHabilitados: string[];

  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Servicios Asignados (instancias reales del catálogo)
export interface ServicioAsignado {
  id: string;

  // Referencia al catálogo y grupo
  catalogoServicioId: string;
  catalogoServicioNombre: string;
  grupoId: string;
  grupoNombre: string;

  // Estado del servicio
  esActual: boolean;
  estado: 'activo' | 'pendiente' | 'coordinacion' | 'pausado' | 'completado';
  tiquet: 'SI' | 'NO' | 'CORD' | 'ESPACH' | string;

  // Asignación de profesionales
  profesionalPrincipalId: string;
  profesionalPrincipalNombre: string;
  profesionalSegundaOpcionId?: string;
  profesionalSegundaOpcionNombre?: string;
  profesionalTerceraOpcionId?: string;
  profesionalTerceraOpcionNombre?: string;

  // Detalles de ejecución
  requiereApoyo: boolean;
  sala?: string;
  tiempoReal?: number;

  // Planificación
  fechaProgramada?: Date;
  horaInicio?: string;
  horaFin?: string;

  // Seguimiento
  ultimaRealizacion?: Date;
  proximaRealizacion?: Date;
  vecesRealizadoMes: number;

  // Observaciones
  notas?: string;
  supervision: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  modificadoPor?: string;
}

// Salas de la clínica
export interface Sala {
  id: string;
  nombre: string;
  tipo: 'medicina' | 'fisioterapia' | 'enfermeria' | 'general';
  capacidad: number;
  equipamiento?: string[];
  activa: boolean;

  ocupacionActual?: number;

  createdAt: Date;
  updatedAt: Date;
}

// Estadísticas y reportes
export interface EstadisticasServicios {
  totalServicios: number;
  serviciosActivos: number;
  serviciosPendientes: number;
  serviciosCoordinacion: number;

  porCategoria: {
    medicina: number;
    fisioterapia: number;
    enfermeria: number;
  };

  conTicket: number;
  sinTicket: number;
  enCoordinacion: number;

  cargaTotalMensual: number;
  distribucionPorProfesional: {
    profesionalId: string;
    profesionalNombre: string;
    serviciosAsignados: number;
    cargaPorcentaje: number;
  }[];

  ocupacionSalas: {
    salaId: string;
    salaNombre: string;
    ocupacionPorcentaje: number;
    serviciosProgramados: number;
  }[];
}

// Plantilla de horario semanal
export interface HorarioSemanal {
  id: string;
  profesionalId: string;
  profesionalNombre: string;
  semana: string;

  bloques: {
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    horaInicio: string;
    horaFin: string;
    servicioAsignadoId?: string;
    grupoId?: string;
    tipo: 'disponible' | 'ocupado' | 'descanso';
  }[];

  createdAt: Date;
  updatedAt: Date;
}
