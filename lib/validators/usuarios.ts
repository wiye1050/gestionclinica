import { z } from 'zod';
import { optionalEmail, userRolesArraySchema, phoneSchema } from './common';

/**
 * Validadores para el módulo de Usuarios
 */

// Schema para crear un usuario
export const createUsuarioSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100),
  roles: userRolesArraySchema,
  telefono: phoneSchema,
  profesionalId: z.string().optional(),
  pacienteId: z.string().optional(),
  activo: z.boolean().default(true),
  notificacionesEmail: z.boolean().default(true),
  notificacionesPush: z.boolean().default(false),
});

// Schema para actualizar un usuario
export const updateUsuarioSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  email: optionalEmail,
  nombre: z.string().min(1).max(100).optional(),
  apellidos: z.string().min(1).max(100).optional(),
  roles: userRolesArraySchema.optional(),
  telefono: phoneSchema,
  profesionalId: z.string().optional(),
  pacienteId: z.string().optional(),
  activo: z.boolean().optional(),
  notificacionesEmail: z.boolean().optional(),
  notificacionesPush: z.boolean().optional(),
});

// Schema para cambiar roles de un usuario
export const updateUserRolesSchema = z.object({
  userId: z.string().min(1, 'El ID del usuario es requerido'),
  roles: userRolesArraySchema,
});

// Tipos inferidos
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type UpdateUserRolesInput = z.infer<typeof updateUserRolesSchema>;
