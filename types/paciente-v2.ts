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
// FUNCIONES DE MAPEO
// ============================================

// Mapea registros de historial a citas
export function mapHistorialToCita(historial: any): Cita | null {
  if (historial.tipo !== 'consulta') return null;

  return {
    id: historial.id,
    pacienteId: historial.pacienteId,
    fecha: historial.fecha.toDate ? historial.fecha.toDate() : new Date(historial.fecha),
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
export function mapServicioToTratamiento(servicio: any, pacienteId: string): Tratamiento {
  return {
    id: servicio.id,
    pacienteId,
    grupoId: servicio.grupoId,
    servicioNombre: servicio.catalogoServicioNombre,
    profesionalId: servicio.profesionalPrincipalId,
    profesionalNombre: servicio.profesionalPrincipalNombre || 'Sin asignar',
    estado: servicio.estado,
    fechaInicio: servicio.createdAt.toDate ? servicio.createdAt.toDate() : new Date(servicio.createdAt),
    fechaFin: servicio.fechaFin ? (servicio.fechaFin.toDate ? servicio.fechaFin.toDate() : new Date(servicio.fechaFin)) : undefined,
    vecesRealizadoMes: servicio.vecesRealizadoMes || 0,
    ultimaRealizacion: servicio.ultimaRealizacion ? (servicio.ultimaRealizacion.toDate ? servicio.ultimaRealizacion.toDate() : new Date(servicio.ultimaRealizacion)) : undefined,
    proximaRealizacion: servicio.proximaRealizacion ? (servicio.proximaRealizacion.toDate ? servicio.proximaRealizacion.toDate() : new Date(servicio.proximaRealizacion)) : undefined,
    notas: servicio.notas,
  };
}

// Mapea registros de historial a actividades
export function mapHistorialToActividad(historial: any): Actividad {
  const fecha = historial.fecha.toDate ? historial.fecha.toDate() : new Date(historial.fecha);

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
export function mapHistorialToNota(historial: any): Nota | null {
  if (!historial.descripcion && !historial.resultado) return null;

  return {
    id: historial.id,
    pacienteId: historial.pacienteId,
    fecha: historial.fecha.toDate ? historial.fecha.toDate() : new Date(historial.fecha),
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
