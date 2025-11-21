import { z } from 'zod';

export const createProtocolSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  area: z.enum(['medicina', 'fisioterapia', 'enfermeria', 'administracion', 'marketing', 'operaciones']),
  descripcion: z.string().optional(),
  requiereQuiz: z.boolean().default(false),
  visiblePara: z
    .array(z.enum(['admin', 'coordinador', 'profesional', 'recepcion', 'invitado']))
    .nonempty('Debe seleccionar al menos un grupo de usuarios')
});

export const createProtocolVersionSchema = z.object({
  protocoloId: z.string().min(1),
  contenido: z.string().min(10, 'El contenido debe tener al menos 10 caracteres'),
  checklist: z
    .array(
      z.object({
        item: z.string().min(2),
        requerido: z.boolean().default(true)
      })
    )
    .default([]),
  guionComunicacion: z.string().optional(),
  anexos: z
    .array(z.object({ nombre: z.string().min(2), url: z.string().url() }))
    .default([]),
  quiz: z
    .object({
      preguntas: z
        .array(
          z.object({
            pregunta: z.string().min(5),
            opciones: z.array(z.string().min(1)).min(2),
            respuestaCorrecta: z.number().min(0)
          })
        )
        .min(1)
    })
    .optional()
});

export const registerReadingSchema = z.object({
  protocoloId: z.string().min(1),
  version: z.number().min(1),
  checklistConfirmada: z.boolean(),
  resultadoQuiz: z.number().min(0).max(100).optional(),
  aprobadoQuiz: z.boolean().optional()
});
