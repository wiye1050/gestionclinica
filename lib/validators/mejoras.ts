import { z } from 'zod';

export const createMejoraSchema = z.object({
  titulo: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  descripcion: z.string().min(10, 'Describe la mejora con más detalle'),
  area: z.enum(['salas', 'equipos', 'procedimientos', 'software', 'comunicacion', 'otro']),
  responsableUid: z.string().optional(),
  responsableNombre: z.string().optional(),
  reach: z.coerce.number().min(0),
  impact: z.coerce.number().min(0),
  confidence: z.coerce.number().min(0).max(100),
  effort: z.coerce.number().min(1)
});

export const updateMejoraEstadoSchema = z.object({
  mejoraId: z.string().min(1),
  estado: z.enum(['idea', 'en-analisis', 'planificada', 'en-progreso', 'completada'])
});

export const addEvidenciaSchema = z.object({
  mejoraId: z.string().min(1),
  tipo: z.enum(['imagen', 'documento', 'enlace', 'texto']),
  url: z.string().url().optional(),
  descripcion: z.string().optional()
});
