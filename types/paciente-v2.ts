// types/paciente-v2.ts
// Tipos auxiliares para el sistema V2 de gestión de pacientes

import { Paciente } from './index';

// Re-exportar Paciente como PacienteV2 para compatibilidad
export type PacienteV2 = Paciente;

// ============================================
// TIPOS AUXILIARES
// ============================================

export interface Cita {
  id: string;
  pacienteId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  tipo: 'consulta' | 'tratamiento' | 'seguimiento' | 'revision';
  estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada';
  profesionalId: string;
  profesionalNombre: string;
  servicioId?: string;
  servicioNombre?: string;
  observaciones?: string;
  sala?: string;
}

export interface Tratamiento {
  id: string;
  pacienteId: string;
  grupoId: string;
  servicioNombre: string;
  profesionalId: string;
  profesionalNombre: string;
  estado: 'activo' | 'pausado' | 'completado';
  fechaInicio: Date;
  fechaFin?: Date;
  frecuencia?: string;
  vecesRealizadoMes: number;
  ultimaRealizacion?: Date;
  proximaRealizacion?: Date;
  notas?: string;
}

export interface Documento {
  id: string;
  pacienteId: string;
  nombre: string;
  tipo: 'informe' | 'analisis' | 'imagen' | 'consentimiento' | 'otro';
  url: string;
  fechaSubida: Date;
  subidoPor: string;
  subidoPorNombre: string;
  tamano?: number;
  descripcion?: string;
}

export interface Nota {
  id: string;
  pacienteId: string;
  fecha: Date;
  titulo: string;
  contenido: string;
  tipo: 'clinica' | 'administrativa' | 'seguimiento';
  profesionalId: string;
  profesionalNombre: string;
  importante: boolean;
}

export interface Actividad {
  id: string;
  pacienteId: string;
  fecha: Date;
  tipo: 'cita' | 'tratamiento' | 'nota' | 'documento' | 'cambio';
  descripcion: string;
  profesionalId?: string;
  profesionalNombre?: string;
  icono: string;
  color: string;
}

// ============================================
// TIPOS PARA DATOS DE FIREBASE
// ============================================

interface FirebaseTimestamp {
  toDate(): Date;
}

interface HistorialFirebase {
  id: string;
  pacienteId: string;
  tipo: string;
  fecha: FirebaseTimestamp | Date;
  horaInicio?: string;
  horaFin?: string;
  profesionalId?: string;
  profesionalNombre?: string;
  servicioId?: string;
  servicioNombre?: string;
  descripcion?: string;
  resultado?: string;
  planesSeguimiento?: string;
}

interface ServicioFirebase {
  id: string;
  grupoId: string;
  catalogoServicioNombre: string;
  profesionalPrincipalId: string;
  profesionalPrincipalNombre?: string;
  estado: 'activo' | 'pausado' | 'completado';
  createdAt: FirebaseTimestamp | Date;
  fechaFin?: FirebaseTimestamp | Date;
  vecesRealizadoMes?: number;
  ultimaRealizacion?: FirebaseTimestamp | Date;
  proximaRealizacion?: FirebaseTimestamp | Date;
  notas?: string;
}

// ============================================
// FUNCIONES DE MAPEO
// ============================================

// Mapea registros de historial a citas
export function mapHistorialToCita(historial: HistorialFirebase): Cita | null {
  if (historial.tipo !== 'consulta') return null;

  const fecha = historial.fecha instanceof Date
    ? historial.fecha
    : historial.fecha.toDate();

  return {
    id: historial.id,
    pacienteId: historial.pacienteId,
    fecha,
    horaInicio: historial.horaInicio || '09:00',
    horaFin: historial.horaFin || '10:00',
    tipo: 'consulta',
    estado: 'realizada',
    profesionalId: historial.profesionalId || '',
    profesionalNombre: historial.profesionalNombre || 'Sin asignar',
    servicioId: historial.servicioId,
    servicioNombre: historial.servicioNombre,
    observaciones: historial.descripcion,
  };
}

// Mapea servicios asignados a tratamientos
export function mapServicioToTratamiento(servicio: ServicioFirebase, pacienteId: string): Tratamiento {
  const fechaInicio = servicio.createdAt instanceof Date
    ? servicio.createdAt
    : servicio.createdAt.toDate();

  const fechaFin = servicio.fechaFin
    ? (servicio.fechaFin instanceof Date ? servicio.fechaFin : servicio.fechaFin.toDate())
    : undefined;

  const ultimaRealizacion = servicio.ultimaRealizacion
    ? (servicio.ultimaRealizacion instanceof Date ? servicio.ultimaRealizacion : servicio.ultimaRealizacion.toDate())
    : undefined;

  const proximaRealizacion = servicio.proximaRealizacion
    ? (servicio.proximaRealizacion instanceof Date ? servicio.proximaRealizacion : servicio.proximaRealizacion.toDate())
    : undefined;

  return {
    id: servicio.id,
    pacienteId,
    grupoId: servicio.grupoId,
    servicioNombre: servicio.catalogoServicioNombre,
    profesionalId: servicio.profesionalPrincipalId,
    profesionalNombre: servicio.profesionalPrincipalNombre || 'Sin asignar',
    estado: servicio.estado,
    fechaInicio,
    fechaFin,
    vecesRealizadoMes: servicio.vecesRealizadoMes || 0,
    ultimaRealizacion,
    proximaRealizacion,
    notas: servicio.notas,
  };
}

// Mapea registros de historial a actividades
export function mapHistorialToActividad(historial: HistorialFirebase): Actividad {
  const fecha = historial.fecha instanceof Date
    ? historial.fecha
    : historial.fecha.toDate();

  let icono = 'FileText';
  let color = 'blue';

  switch (historial.tipo) {
    case 'consulta':
      icono = 'Calendar';
      color = 'green';
      break;
    case 'tratamiento':
      icono = 'Activity';
      color = 'purple';
      break;
    case 'seguimiento':
      icono = 'MessageSquare';
      color = 'blue';
      break;
    case 'incidencia':
      icono = 'AlertCircle';
      color = 'red';
      break;
  }

  return {
    id: historial.id,
    pacienteId: historial.pacienteId,
    fecha,
    tipo: historial.tipo === 'consulta' ? 'cita' : 'tratamiento',
    descripcion: historial.descripcion || `${historial.tipo} realizado`,
    profesionalId: historial.profesionalId,
    profesionalNombre: historial.profesionalNombre,
    icono,
    color,
  };
}

// Mapea registros de historial a notas
export function mapHistorialToNota(historial: HistorialFirebase): Nota | null {
  if (!historial.descripcion && !historial.resultado) return null;

  const fecha = historial.fecha instanceof Date
    ? historial.fecha
    : historial.fecha.toDate();

  return {
    id: historial.id,
    pacienteId: historial.pacienteId,
    fecha,
    titulo: `Nota de ${historial.tipo}`,
    contenido: [historial.descripcion, historial.resultado, historial.planesSeguimiento]
      .filter(Boolean)
      .join('\n\n'),
    tipo: 'clinica',
    profesionalId: historial.profesionalId || '',
    profesionalNombre: historial.profesionalNombre || 'Sistema',
    importante: historial.tipo === 'incidencia',
  };
}
