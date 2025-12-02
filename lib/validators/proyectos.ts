import { z } from 'zod';
import { optionalString, prioridadSchema } from './common';

/**
 * Validadores para el módulo de Proyectos
 */

export const estadoProyectoSchema = z.enum([
  'backlog',
  'planificado',
  'en-progreso',
  'en-pausa',
  'completado',
  'cancelado',
]);

// Schema para crear un proyecto
export const createProyectoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(200, 'Nombre muy largo'),
  descripcion: optionalString(2000),
  estado: estadoProyectoSchema.default('backlog'),
  prioridad: prioridadSchema.default('media'),
  responsableId: z.string().optional(),
  responsableNombre: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFinPrevista: z.string().optional(),
  fechaFinReal: z.string().optional(),
  presupuesto: z.coerce.number().min(0).optional(),
  gastoActual: z.coerce.number().min(0).optional(),
  progreso: z.coerce.number().int().min(0).max(100).default(0),
  tags: z.array(z.string()).optional().default([]),
  notas: optionalString(5000),
});

// Schema para actualizar un proyecto
export const updateProyectoSchema = createProyectoSchema.partial().extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Schema para agregar una tarea a un proyecto
export const addTareaProyectoSchema = z.object({
  proyectoId: z.string().min(1, 'El ID del proyecto es requerido'),
  titulo: z.string().min(1, 'El título es requerido').max(200),
  descripcion: optionalString(1000),
  asignadoA: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  prioridad: prioridadSchema.default('media'),
  completada: z.boolean().default(false),
});

// Tipos inferidos
export type CreateProyectoInput = z.infer<typeof createProyectoSchema>;
export type UpdateProyectoInput = z.infer<typeof updateProyectoSchema>;
export type AddTareaProyectoInput = z.infer<typeof addTareaProyectoSchema>;
