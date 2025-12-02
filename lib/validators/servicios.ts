import { z } from 'zod';
import { optionalString, uuidSchema } from './common';

/**
 * Validadores para el módulo de Servicios Asignados
 */

export const tiquetSchema = z.enum(['SI', 'NO', 'CORD', 'ESPACH']);

// Schema para crear un servicio asignado
export const createServicioSchema = z.object({
  catalogoServicioId: uuidSchema,
  grupoId: uuidSchema,
  profesionalPrincipalId: uuidSchema,
  profesionalSegundaOpcionId: z.string().uuid().optional(),
  profesionalTerceraOpcionId: z.string().uuid().optional(),
  tiquet: tiquetSchema.default('NO'),
  requiereApoyo: z.boolean().default(false),
  sala: optionalString(50),
  supervision: z.boolean().default(false),
  esActual: z.boolean().default(false),
  notas: optionalString(500),
});

// Schema para actualizar un servicio asignado
export const updateServicioSchema = createServicioSchema.partial().extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Tipos inferidos
export type CreateServicioInput = z.infer<typeof createServicioSchema>;
export type UpdateServicioInput = z.infer<typeof updateServicioSchema>;
