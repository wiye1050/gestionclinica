import { z } from 'zod';
import { optionalString, estadoGenerico, nonNegativeNumber } from './common';

/**
 * Validadores para el módulo de Catálogo de Servicios
 */

export const categoriaServicioSchema = z.enum([
  'consulta',
  'tratamiento',
  'diagnostico',
  'rehabilitacion',
  'seguimiento',
  'prevencion',
  'urgencia',
  'otro',
]);

// Schema para crear un servicio en el catálogo
export const createCatalogoServicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Nombre muy largo'),
  descripcion: optionalString(1000),
  categoria: categoriaServicioSchema,
  duracionEstimadaMinutos: z.coerce.number().int().positive('La duración debe ser positiva').default(30),
  precioBase: nonNegativeNumber.optional(),
  requiereAutorizacion: z.boolean().default(false),
  estado: estadoGenerico.default('activo'),
  codigoInterno: optionalString(50),
  notas: optionalString(500),
});

// Schema para actualizar un servicio del catálogo
export const updateCatalogoServicioSchema = createCatalogoServicioSchema.partial().extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Tipos inferidos
export type CreateCatalogoServicioInput = z.infer<typeof createCatalogoServicioSchema>;
export type UpdateCatalogoServicioInput = z.infer<typeof updateCatalogoServicioSchema>;
