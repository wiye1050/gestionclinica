import { z } from 'zod';

/**
 * Schemas comunes reutilizables en toda la aplicación
 */

// Email opcional o vacío
export const optionalEmail = z
  .string()
  .email('Email inválido')
  .optional()
  .or(z.literal(''));

// Fecha en formato ISO string
export const isoDateString = z.string().datetime('Fecha inválida');

// Fecha opcional en formato ISO string
export const optionalIsoDateString = z.string().datetime().optional();

// UUID válido
export const uuidSchema = z.string().uuid('ID inválido');

// String no vacío con longitud máxima
export const nonEmptyString = (maxLength = 100, fieldName = 'Campo') =>
  z.string().min(1, `${fieldName} es requerido`).max(maxLength, `${fieldName} muy largo`);

// String opcional con longitud máxima
export const optionalString = (maxLength = 2000) =>
  z.string().max(maxLength, 'Texto muy largo').optional();

// Número positivo
export const positiveNumber = z.number().positive('Debe ser un número positivo');

// Número no negativo
export const nonNegativeNumber = z.number().min(0, 'Debe ser mayor o igual a cero');

// Array opcional que por defecto es un array vacío
export const optionalArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.array(schema).optional().default([]);

// Teléfono (formato flexible)
export const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Teléfono inválido')
  .optional();

// Estados comunes
export const estadoGenerico = z.enum(['activo', 'inactivo']);

// Prioridad
export const prioridadSchema = z.enum(['alta', 'media', 'baja']);

// Roles de usuario
export const userRoleSchema = z.enum(['admin', 'coordinador', 'profesional', 'recepcion', 'invitado']);

export const userRolesArraySchema = z.array(userRoleSchema).min(1, 'Debe tener al menos un rol');
