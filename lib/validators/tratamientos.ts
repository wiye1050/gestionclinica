import { z } from 'zod';
import { optionalString } from './common';

/**
 * Validadores para el módulo de Tratamientos
 */

export const categoriaTratamientoSchema = z.enum(['medicina', 'fisioterapia', 'enfermeria', 'mixto']);

// Schema para servicios incluidos en un tratamiento
export const servicioIncluidoSchema = z.object({
  servicioId: z.string().min(1, 'El ID del servicio es requerido'),
  servicioNombre: z.string().min(1, 'El nombre del servicio es requerido'),
  orden: z.coerce.number().int().min(0),
  opcional: z.boolean().default(false),
});

// Schema para crear un tratamiento (alineado con TratamientoInput del server)
export const createTratamientoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Nombre muy largo'),
  descripcion: optionalString(1000),
  categoria: categoriaTratamientoSchema,
  serviciosIncluidos: z.array(servicioIncluidoSchema).default([]),
  activo: z.boolean().default(true),
});

// Schema para actualizar un tratamiento
export const updateTratamientoSchema = createTratamientoSchema.partial().extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Schema para registrar una sesión de tratamiento
export const registerSesionSchema = z.object({
  tratamientoId: z.string().min(1, 'El ID del tratamiento es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  duracionMinutos: z.coerce.number().int().positive('La duración debe ser positiva'),
  notas: optionalString(1000),
  asistio: z.boolean().default(true),
  profesionalId: z.string().optional(),
});

// Tipos inferidos
export type CreateTratamientoInput = z.infer<typeof createTratamientoSchema>;
export type UpdateTratamientoInput = z.infer<typeof updateTratamientoSchema>;
export type RegisterSesionInput = z.infer<typeof registerSesionSchema>;
