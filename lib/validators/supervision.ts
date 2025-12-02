import { z } from 'zod';
import { optionalString } from './common';

/**
 * Validadores para el módulo de Supervisión Clínica
 */

export const tipoSupervisionSchema = z.enum([
  'individual',
  'grupal',
  'caso-clinico',
  'revision-general',
]);

// Schema para crear una evaluación de supervisión
export const createEvaluacionSupervisionSchema = z.object({
  profesionalId: z.string().min(1, 'El ID del profesional es requerido'),
  supervisorId: z.string().min(1, 'El ID del supervisor es requerido'),
  tipo: tipoSupervisionSchema,
  fecha: z.string().min(1, 'La fecha es requerida'),
  duracionMinutos: z.coerce.number().int().positive('La duración debe ser positiva'),
  temas: z.array(z.string()).min(1, 'Debe haber al menos un tema tratado'),
  fortalezas: optionalString(1000),
  areasMejora: optionalString(1000),
  planAccion: optionalString(1000),
  puntuacionGeneral: z.coerce.number().int().min(1).max(10).optional(),
  notas: optionalString(2000),
  proximaFecha: z.string().optional(),
});

// Schema para actualizar una evaluación
export const updateEvaluacionSupervisionSchema = createEvaluacionSupervisionSchema.partial().extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Tipos inferidos
export type CreateEvaluacionSupervisionInput = z.infer<typeof createEvaluacionSupervisionSchema>;
export type UpdateEvaluacionSupervisionInput = z.infer<typeof updateEvaluacionSupervisionSchema>;
