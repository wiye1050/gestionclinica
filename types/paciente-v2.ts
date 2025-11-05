// types/paciente-v2.ts
// Tipos adaptados para componentes V2 usando la estructura original del sistema

import type { 
  Paciente as PacienteOriginal,
  RegistroHistorialPaciente,
  ServicioAsignado,
  Profesional
} from './index';

// ============================================
// RE-EXPORTAR TIPO ORIGINAL
// ============================================

export type PacienteV2 = PacienteOriginal;

// ============================================
// TIPOS PARA COMPONENTES V2
// ============================================

export interface Cita {
  id: string;
  fecha: Date;
  profesional: string;
  profesionalId: string;
  tipo: 'consulta' | 'tratamiento' | 'seguimiento' | 'revision';
  estado: 'programada' | 'realizada' | 'cancelada';
  sala?: string;
  motivo?: string;
  notas?: string;
  evolucion?: string;
  diagnosticos: string[];
  documentos: Array<{
    id: string;
    nombre: string;
    url: string;
  }>;
}

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion?: string;
  progreso: number;
  profesional: string;
  profesionalId: string;
  estado: 'activo' | 'pausado' | 'completado';
  sesionesTotales?: number;
  sesionesCompletadas?: number;
  fechaInicio: Date;
  fechaFin?: Date;
}

export interface Documento {
  id: string;
  nombre: string;
  tipo: 'informe' | 'consentimiento' | 'receta' | 'imagen' | 'analitica' | 'factura' | 'otro';
  tamaño: number;
  url: string;
  fechaSubida: Date;
  subidoPor: string;
  etiquetas: string[];
}

export interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  categoria: 'clinica' | 'comunicacion' | 'alerta' | 'administrativa';
  autor: string;
  fecha: Date;
  esPrivada: boolean;
  etiquetas: string[];
}

export interface Actividad {
  id: string;
  tipo: 'cita' | 'documento' | 'receta' | 'tratamiento' | 'nota' | 'factura' | 'pago';
  titulo: string;
  descripcion?: string;
  fecha: Date;
  usuario?: string;
  estado?: 'success' | 'warning' | 'error' | 'info';
}

// ============================================
// FUNCIONES DE MAPEO
// ============================================

export function mapHistorialToCita(registro: RegistroHistorialPaciente): Cita {
  const now = new Date();
  const estado = registro.fecha > now ? 'programada' : 'realizada';
  
  const tipoMap: Record<RegistroHistorialPaciente['tipo'], Cita['tipo']> = {
    consulta: 'consulta',
    tratamiento: 'tratamiento',
    seguimiento: 'seguimiento',
    incidencia: 'revision'
  };

  return {
    id: registro.id,
    fecha: registro.fecha,
    profesional: registro.profesionalNombre ?? 'Sin asignar',
    profesionalId: registro.profesionalId ?? 'desconocido',
    tipo: tipoMap[registro.tipo] ?? 'consulta',
    estado,
    motivo: registro.descripcion,
    notas: registro.resultado,
    evolucion: registro.planesSeguimiento,
    diagnosticos: registro.resultado ? [registro.resultado] : [],
    documentos: (registro.adjuntos ?? []).map((url, index) => ({
      id: `${registro.id}-doc-${index}`,
      nombre: `Adjunto ${index + 1}`,
      url
    }))
  };
}

export function mapServicioToTratamiento(servicio: ServicioAsignado): Tratamiento {
  return {
    id: servicio.id,
    nombre: servicio.catalogoServicioNombre ?? 'Servicio',
    descripcion: servicio.notas,
    progreso: servicio.esActual ? 70 : 40,
    profesional: servicio.profesionalPrincipalNombre ?? 'Sin profesional',
    profesionalId: servicio.profesionalPrincipalId,
    estado: servicio.estado === 'activo' ? 'activo' : servicio.estado === 'completado' ? 'completado' : 'pausado',
    sesionesTotales: undefined,
    sesionesCompletadas: servicio.vecesRealizadoMes,
    fechaInicio: servicio.createdAt,
    fechaFin: servicio.estado === 'completado' ? servicio.updatedAt : undefined
  };
}

export function mapHistorialToActividad(registro: RegistroHistorialPaciente): Actividad {
  const tipoMap: Record<RegistroHistorialPaciente['tipo'], Actividad['tipo']> = {
    consulta: 'cita',
    tratamiento: 'tratamiento',
    seguimiento: 'nota',
    incidencia: 'documento'
  };

  const estado = registro.resultado
    ? 'success'
    : registro.planesSeguimiento
    ? 'info'
    : undefined;

  return {
    id: registro.id,
    tipo: tipoMap[registro.tipo] ?? 'documento',
    titulo: registro.servicioNombre ?? registro.tipo,
    descripcion: registro.descripcion,
    fecha: registro.fecha,
    usuario: registro.profesionalNombre ?? registro.creadoPor,
    estado
  };
}

export function mapHistorialToNota(registro: RegistroHistorialPaciente): Nota {
  return {
    id: registro.id,
    titulo: registro.servicioNombre ?? registro.tipo,
    contenido: registro.descripcion ?? '',
    categoria:
      registro.tipo === 'incidencia'
        ? 'alerta'
        : registro.tipo === 'seguimiento'
        ? 'comunicacion'
        : 'clinica',
    autor: registro.profesionalNombre ?? registro.creadoPor ?? 'Sistema',
    fecha: registro.fecha,
    esPrivada: false,
    etiquetas: [registro.tipo]
  };
}
