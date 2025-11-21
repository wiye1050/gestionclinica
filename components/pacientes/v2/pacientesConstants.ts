/**
 * Constantes centralizadas para el módulo de pacientes
 */

import type { RegistroHistorialPaciente } from '@/types';

// Filtros de historial
export const HISTORIAL_FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'clinico', label: 'Clínicos' },
  { value: 'administrativo', label: 'Administrativos' },
] as const;

export type HistorialFiltro = (typeof HISTORIAL_FILTROS)[number]['value'];

// Tipos de documentos de paciente
export const TIPOS_DOCUMENTO = [
  'informe',
  'consentimiento',
  'receta',
  'imagen',
  'analitica',
  'factura',
  'otro',
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

// Mapeo de colores para badges de tipo de historial
export const HISTORIAL_BADGE_COLORS: Record<RegistroHistorialPaciente['tipo'], string> = {
  consulta: 'bg-brand-subtle text-brand',
  tratamiento: 'bg-success-bg text-success',
  seguimiento: 'bg-warn-bg text-warn',
  incidencia: 'bg-danger-bg text-danger',
};

// Tipos clínicos para filtros
export const TIPOS_CLINICOS: Array<RegistroHistorialPaciente['tipo']> = [
  'consulta',
  'tratamiento',
  'seguimiento',
];

// Helpers para filtros
export function esRegistroClinico(tipo: RegistroHistorialPaciente['tipo']): boolean {
  return TIPOS_CLINICOS.includes(tipo);
}

export function filtrarHistorial(
  historial: RegistroHistorialPaciente[],
  filtro: HistorialFiltro
): RegistroHistorialPaciente[] {
  if (filtro === 'todos') return historial;
  if (filtro === 'clinico') return historial.filter((r) => esRegistroClinico(r.tipo));
  return historial.filter((r) => !esRegistroClinico(r.tipo));
}

// Mapeo de tipo de registro a tipo de actividad de timeline
export type ActivityType = 'cita' | 'nota' | 'documento' | 'seguimiento' | 'incidencia' | 'otro';

export function mapRegistroToActivityType(tipo: RegistroHistorialPaciente['tipo']): ActivityType {
  switch (tipo) {
    case 'consulta':
    case 'tratamiento':
      return 'cita';
    case 'seguimiento':
      return 'seguimiento';
    case 'incidencia':
      return 'incidencia';
    default:
      return 'otro';
  }
}

// Mapeo de tipo de registro a categoría de nota
export type CategoriaNotas = 'clinica' | 'alerta' | 'comunicacion' | 'administrativa';

export function mapRegistroToNotaCategoria(tipo: RegistroHistorialPaciente['tipo']): CategoriaNotas {
  switch (tipo) {
    case 'incidencia':
      return 'alerta';
    case 'seguimiento':
      return 'comunicacion';
    case 'consulta':
    case 'tratamiento':
      return 'clinica';
    default:
      return 'administrativa';
  }
}

// Estado de citas
export const ESTADOS_CITA = [
  'programada',
  'confirmada',
  'realizada',
  'cancelada',
  'no-asistio',
] as const;

export type EstadoCita = (typeof ESTADOS_CITA)[number];

// Tipos de identificación
export const TIPOS_IDENTIFICACION = [
  { value: 'dni', label: 'DNI' },
  { value: 'nie', label: 'NIE' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'otro', label: 'Otro' },
] as const;

// Géneros
export const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no-binario', label: 'No binario' },
  { value: 'no-especificado', label: 'Prefiero no decir' },
] as const;

// Niveles de riesgo
export const NIVELES_RIESGO = [
  { value: 'bajo', label: 'Bajo', color: 'bg-success-bg text-success' },
  { value: 'medio', label: 'Medio', color: 'bg-warn-bg text-warn' },
  { value: 'alto', label: 'Alto', color: 'bg-danger-bg text-danger' },
] as const;

// Estados del paciente
export const ESTADOS_PACIENTE = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'alta', label: 'Alta' },
] as const;
