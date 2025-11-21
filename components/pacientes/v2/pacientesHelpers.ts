/**
 * Helpers para el módulo de pacientes
 */

import type { RegistroHistorialPaciente, Paciente } from '@/types';
import type { Cita } from './PatientCitasTab';
import type { Activity as TimelineActivity } from './PatientTimeline';
import type { AgendaLinkBuilder } from './types';

/**
 * Tipo para documentos de paciente
 */
export type DocumentoPaciente = {
  id: string;
  nombre: string;
  tipo: 'informe' | 'consentimiento' | 'receta' | 'imagen' | 'analitica' | 'factura' | 'otro';
  tamaño: number;
  url: string;
  fechaSubida: Date;
  subidoPor: string;
  etiquetas: string[];
};

/**
 * Tipo para notas de paciente
 */
export type NotaPaciente = {
  id: string;
  titulo: string;
  contenido: string;
  categoria: 'clinica' | 'alerta' | 'comunicacion' | 'administrativa';
  autor: string;
  fecha: Date;
  esPrivada: boolean;
  etiquetas: string[];
};

/**
 * Mapea tipo de registro a tipo de actividad de timeline
 */
export function mapRegistroToActivityType(
  tipo: RegistroHistorialPaciente['tipo']
): TimelineActivity['tipo'] {
  switch (tipo) {
    case 'consulta':
      return 'cita';
    case 'tratamiento':
      return 'tratamiento';
    case 'seguimiento':
      return 'nota';
    case 'incidencia':
      return 'documento';
    default:
      return 'documento';
  }
}

/**
 * Mapea registro de historial a tipo Cita
 */
export function mapRegistroToCita(registro: RegistroHistorialPaciente): Cita {
  const now = new Date();
  const estado = registro.fecha > now ? 'programada' : 'realizada';
  const tipoMap: Record<RegistroHistorialPaciente['tipo'], Cita['tipo']> = {
    consulta: 'consulta',
    tratamiento: 'tratamiento',
    seguimiento: 'seguimiento',
    incidencia: 'revision',
  };

  return {
    id: registro.id,
    fecha: registro.fecha,
    profesional: registro.profesionalNombre ?? 'Sin asignar',
    profesionalId: registro.profesionalId ?? 'desconocido',
    tipo: tipoMap[registro.tipo] ?? 'consulta',
    estado,
    sala: undefined,
    motivo: registro.descripcion,
    notas: registro.resultado,
    evolucion: registro.planesSeguimiento,
    diagnosticos: registro.resultado ? [registro.resultado] : [],
    documentos: (registro.adjuntos ?? []).map((url, index) => ({
      id: `${registro.id}-doc-${index}`,
      nombre: `Adjunto ${index + 1}`,
      url,
    })),
  };
}

/**
 * Convierte historial a actividades de timeline
 */
export function historialToActividades(
  historial: RegistroHistorialPaciente[]
): TimelineActivity[] {
  return historial.map((registro) => {
    const tipo = mapRegistroToActivityType(registro.tipo);
    const estado = registro.resultado
      ? 'success'
      : registro.planesSeguimiento
      ? 'info'
      : undefined;

    return {
      id: registro.id,
      tipo,
      titulo: registro.servicioNombre ?? registro.tipo,
      descripcion: registro.descripcion,
      fecha: registro.fecha,
      usuario: registro.profesionalNombre ?? registro.creadoPor,
      estado,
      agendaContext:
        tipo === 'cita'
          ? {
              profesionalId: registro.profesionalId ?? undefined,
              date: registro.fecha,
            }
          : undefined,
    } satisfies TimelineActivity;
  });
}

/**
 * Convierte historial a lista de citas
 */
export function historialToCitas(historial: RegistroHistorialPaciente[]): Cita[] {
  return historial.map(mapRegistroToCita);
}

/**
 * Obtiene próximas citas ordenadas
 */
export function getProximasCitas(citas: Cita[], maxCount = 8) {
  const now = new Date();
  return citas
    .filter((cita) => cita.fecha >= now)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .slice(0, maxCount)
    .map((cita) => ({
      id: cita.id,
      fecha: cita.fecha,
      profesional: cita.profesional,
      profesionalId: cita.profesionalId,
      tipo: cita.tipo,
      estado: cita.estado,
    }));
}

/**
 * Extrae documentos del paciente (consentimientos + adjuntos del historial)
 */
export function extractDocumentos(
  paciente: Paciente | null,
  historial: RegistroHistorialPaciente[]
): DocumentoPaciente[] {
  if (!paciente) return [];

  const consentimientosDocs = paciente.consentimientos.map((consent, index) => ({
    id: consent.documentoId ?? `cons-${index}`,
    nombre: consent.tipo,
    tipo: 'consentimiento' as const,
    tamaño: 0,
    url: consent.documentoId ?? '#',
    fechaSubida: consent.fecha ?? new Date(),
    subidoPor: consent.firmadoPor ?? `${paciente.nombre} ${paciente.apellidos}`,
    etiquetas: ['consentimiento'],
  }));

  const adjuntosDocs: DocumentoPaciente[] = historial.flatMap((registro) =>
    (registro.adjuntos ?? []).map((url, index) => ({
      id: `${registro.id}-adj-${index}`,
      nombre: registro.servicioNombre
        ? `${registro.servicioNombre} adjunto`
        : `Adjunto ${index + 1}`,
      tipo: 'otro' as const,
      tamaño: 0,
      url,
      fechaSubida: registro.fecha,
      subidoPor: registro.profesionalNombre ?? registro.creadoPor,
      etiquetas: ['historial'],
    }))
  );

  return [...consentimientosDocs, ...adjuntosDocs];
}

/**
 * Convierte historial a notas
 */
export function historialToNotas(historial: RegistroHistorialPaciente[]): NotaPaciente[] {
  return historial.map((registro) => ({
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
    etiquetas: [registro.tipo],
  }));
}

/**
 * Extrae datos de alergias del paciente
 */
export function extractAlergias(paciente: Paciente | null) {
  return (paciente?.alergias ?? []).map((nombre, index) => ({
    id: `alergia-${index}`,
    nombre,
    severidad: 'moderada' as const,
  }));
}

/**
 * Extrae antecedentes del paciente
 */
export function extractAntecedentes(paciente: Paciente | null) {
  return (paciente?.diagnosticosPrincipales ?? []).map((condicion, index) => ({
    id: `antecedente-${index}`,
    tipo: 'personal' as const,
    condicion,
  }));
}

/**
 * Crea un builder de enlaces a la agenda para un paciente
 */
export function createAgendaLinkBuilder(paciente: Paciente | null): AgendaLinkBuilder | undefined {
  if (!paciente) return undefined;

  const pacienteNombre = `${paciente.nombre ?? ''} ${paciente.apellidos ?? ''}`.trim();

  return ((options = {}) => {
    const params = new URLSearchParams();
    params.set('view', 'multi');
    const profesional = options.profesionalId ?? paciente.profesionalReferenteId;
    if (profesional) {
      params.set('profesionales', profesional);
    }
    if (options.date instanceof Date && !Number.isNaN(options.date.getTime())) {
      params.set('date', options.date.toISOString());
    }
    if (options.newEvent) {
      params.set('newEvent', '1');
    }
    params.set('pacienteId', paciente.id);
    if (pacienteNombre) {
      params.set('pacienteNombre', pacienteNombre);
    }
    return `/dashboard/agenda?${params.toString()}`;
  }) as AgendaLinkBuilder;
}
