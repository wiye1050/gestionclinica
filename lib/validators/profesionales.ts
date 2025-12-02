import { z } from 'zod';
import { optionalEmail, optionalString, estadoGenerico, phoneSchema } from './common';

/**
 * Validadores para el módulo de Profesionales
 */

export const especialidadSchema = z.enum(['medicina', 'fisioterapia', 'enfermeria']);

// Schema para crear un profesional (alineado con ProfesionalInput del server)
export const createProfesionalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre muy largo'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100, 'Apellidos muy largos'),
  email: z.string().min(1, 'El email es requerido'),
  telefono: z.string().optional(),
  especialidad: especialidadSchema,
  horasSemanales: z.coerce.number().int().positive('Las horas semanales deben ser positivas'),
  diasTrabajo: z.array(z.string()).min(1, 'Debe seleccionar al menos un día'),
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de inicio inválida'),
  horaFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de fin inválida'),
  activo: z.boolean().default(true),
});

// Schema para actualizar un profesional
export const updateProfesionalSchema = createProfesionalSchema.partial();

// Tipos inferidos
export type CreateProfesionalInput = z.infer<typeof createProfesionalSchema>;
export type UpdateProfesionalInput = z.infer<typeof updateProfesionalSchema>;
