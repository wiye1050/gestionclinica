/**
 * Validators - Schemas de validación Zod centralizados
 *
 * Este archivo re-exporta todos los schemas de validación de la aplicación.
 * Permite importar cualquier validator desde un solo lugar:
 *
 * @example
 * import { createPacienteSchema, createEventoAgendaSchema } from '@/lib/validators';
 */

// Common schemas
export * from './common';

// Módulos principales
export * from './pacientes';
export * from './profesionales';
export * from './servicios';
export * from './tratamientos';
export * from './agenda';
export * from './catalogoServicios';
export * from './supervision';
export * from './proyectos';
export * from './reportes';
export * from './usuarios';
export * from './formularios';
export * from './upload';

// Protocolos y mejoras (ya existentes)
export * from './protocols';
export * from './mejoras';
