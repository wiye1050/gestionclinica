import { z } from 'zod';
import { optionalString } from './common';

/**
 * Validadores para el módulo de Reportes Diarios
 */

// Schema para crear un reporte diario
export const createReporteDiarioSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  profesionalId: z.string().min(1, 'El profesional es requerido'),
  pacientesAtendidos: z.coerce.number().int().min(0, 'Debe ser un número no negativo'),
  consultasRealizadas: z.coerce.number().int().min(0),
  tratamientosRealizados: z.coerce.number().int().min(0),
  urgenciasAtendidas: z.coerce.number().int().min(0).optional(),
  horasTrabajadas: z.coerce.number().min(0).max(24),
  incidencias: z.array(
    z.object({
      tipo: z.enum(['tecnica', 'administrativa', 'clinica', 'otra']),
      descripcion: z.string().min(1),
      gravedad: z.enum(['baja', 'media', 'alta']),
      resuelta: z.boolean().default(false),
    })
  ).optional().default([]),
  observaciones: optionalString(2000),
  estadoGeneral: z.enum(['excelente', 'bueno', 'regular', 'malo']).default('bueno'),
});

// Schema para actualizar un reporte diario
export const updateReporteDiarioSchema = createReporteDiarioSchema.partial().extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Schema para generar informe mensual
export const generateInformeMensualSchema = z.object({
  mes: z.coerce.number().int().min(1).max(12, 'Mes inválido'),
  año: z.coerce.number().int().min(2020).max(2100, 'Año inválido'),
  profesionalId: z.string().optional(),
});

// Tipos inferidos
export type CreateReporteDiarioInput = z.infer<typeof createReporteDiarioSchema>;
export type UpdateReporteDiarioInput = z.infer<typeof updateReporteDiarioSchema>;
export type GenerateInformeMensualInput = z.infer<typeof generateInformeMensualSchema>;
