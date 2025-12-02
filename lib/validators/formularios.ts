import { z } from 'zod';
import { optionalString, userRolesArraySchema } from './common';

/**
 * Validadores para el módulo de Formularios
 */

export const tipoFormularioSchema = z.enum([
  'evaluacion-inicial',
  'seguimiento',
  'alta',
  'consentimiento',
  'satisfaccion',
  'otro',
]);

export const tipoCampoSchema = z.enum([
  'texto-corto',
  'texto-largo',
  'numero',
  'email',
  'telefono',
  'fecha',
  'hora',
  'seleccion-unica',
  'seleccion-multiple',
  'escala',
  'si-no',
  'firma',
  'archivo',
]);

// Schema para un campo de formulario
const campoFormularioSchema = z.object({
  id: z.string().min(1),
  etiqueta: z.string().min(1, 'La etiqueta es requerida'),
  tipo: tipoCampoSchema,
  requerido: z.boolean().default(false),
  descripcion: optionalString(500),
  opciones: z.array(z.string()).optional(),
  valorMin: z.coerce.number().optional(),
  valorMax: z.coerce.number().optional(),
  placeholder: optionalString(100),
  validacion: z.string().optional(),
});

// Schema para crear una plantilla de formulario
export const createFormularioPlantillaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(200),
  descripcion: optionalString(1000),
  tipo: tipoFormularioSchema,
  visiblePara: userRolesArraySchema,
  campos: z.array(campoFormularioSchema).min(1, 'Debe haber al menos un campo'),
  requiereAprobacion: z.boolean().default(false),
  activo: z.boolean().default(true),
  version: z.coerce.number().int().positive().default(1),
});

// Schema para actualizar una plantilla
export const updateFormularioPlantillaSchema = createFormularioPlantillaSchema.partial().extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Schema para crear una respuesta de formulario
export const createRespuestaFormularioSchema = z.object({
  formularioPlantillaId: z.string().min(1, 'El ID de la plantilla es requerido'),
  pacienteId: z.string().optional(),
  profesionalId: z.string().optional(),
  respuestas: z.record(z.string(), z.unknown()),
  completado: z.boolean().default(false),
  fechaRespuesta: z.string().optional(),
});

// Schema para actualizar una respuesta
export const updateRespuestaFormularioSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  respuestas: z.record(z.string(), z.unknown()).optional(),
  completado: z.boolean().optional(),
  aprobado: z.boolean().optional(),
  aprobadoPorId: z.string().optional(),
  fechaAprobacion: z.string().optional(),
  notas: optionalString(1000),
});

// Tipos inferidos
export type CreateFormularioPlantillaInput = z.infer<typeof createFormularioPlantillaSchema>;
export type UpdateFormularioPlantillaInput = z.infer<typeof updateFormularioPlantillaSchema>;
export type CreateRespuestaFormularioInput = z.infer<typeof createRespuestaFormularioSchema>;
export type UpdateRespuestaFormularioInput = z.infer<typeof updateRespuestaFormularioSchema>;
