import { z } from 'zod';
import { optionalString, prioridadSchema } from './common';

/**
 * Validadores para el módulo de Agenda
 */

export const tipoEventoSchema = z.enum([
  'consulta',
  'seguimiento',
  'revision',
  'tratamiento',
  'urgencia',
  'administrativo',
]);

export const estadoEventoSchema = z.enum(['programada', 'confirmada', 'realizada', 'cancelada']);

// Schema para crear un evento en la agenda
export const createEventoAgendaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200, 'Título muy largo'),
  tipo: tipoEventoSchema.default('consulta'),
  pacienteId: z.string().nullable().optional(),
  profesionalId: z.string().min(1, 'El profesional es requerido'),
  salaId: z.string().nullable().optional(),
  servicioId: z.string().nullable().optional(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
  estado: estadoEventoSchema.default('programada'),
  prioridad: prioridadSchema.default('media'),
  notas: optionalString(1000),
  requiereSeguimiento: z.boolean().default(false),
});

// Schema para actualizar un evento de agenda
export const updateEventoAgendaSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  titulo: z.string().min(1).max(200).optional(),
  tipo: tipoEventoSchema.optional(),
  pacienteId: z.string().nullable().optional(),
  profesionalId: z.string().optional(),
  salaId: z.string().nullable().optional(),
  servicioId: z.string().nullable().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  estado: estadoEventoSchema.optional(),
  prioridad: prioridadSchema.optional(),
  notas: optionalString(1000),
  requiereSeguimiento: z.boolean().optional(),
});

// Schema para consultar disponibilidad
export const consultarDisponibilidadSchema = z.object({
  profesionalId: z.string().min(1, 'El ID del profesional es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  duracionMinutos: z.coerce.number().int().positive('La duración debe ser positiva').default(30),
});

// Tipos inferidos
export type CreateEventoAgendaInput = z.infer<typeof createEventoAgendaSchema>;
export type UpdateEventoAgendaInput = z.infer<typeof updateEventoAgendaSchema>;
export type ConsultarDisponibilidadInput = z.infer<typeof consultarDisponibilidadSchema>;
