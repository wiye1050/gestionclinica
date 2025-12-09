import { z } from 'zod';
import { optionalEmail, optionalString, optionalArray, estadoGenerico } from './common';

/**
 * Validadores para el módulo de Pacientes
 */

// Estados específicos de paciente
export const estadoPacienteSchema = z.enum(['activo', 'inactivo', 'egresado']);

export const riesgoPacienteSchema = z.enum(['alto', 'medio', 'bajo']);

// Género del paciente
export const generoPacienteSchema = z.enum(['masculino', 'femenino', 'otro', 'no-especificado']);

// Schema para crear un paciente
export const createPacienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre muy largo'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100, 'Apellidos muy largos'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  genero: generoPacienteSchema,
  documentoId: optionalString(50),
  email: optionalEmail,
  telefono: optionalString(20),
  direccion: optionalString(200),
  codigoPostal: optionalString(10),
  ciudad: optionalString(100),
  estado: estadoPacienteSchema.default('activo'),
  riesgo: riesgoPacienteSchema.default('bajo'),
  profesionalReferenteId: optionalString(50),
  grupoPacienteId: optionalString(50),
  notas: optionalString(2000),
  alergias: z.array(z.string()).default([]),
  alertasClinicas: z.array(z.string()).default([]),
  diagnosticosPrincipales: z.array(z.string()).default([]),
});

// Schema para actualizar un paciente (todos los campos opcionales)
export const updatePacienteSchema = createPacienteSchema.partial();

// Schema para importar pacientes desde Excel
export const importPacientesSchema = z.object({
  pacientes: z.array(
    z.object({
      nombre: z.string().min(1),
      apellidos: z.string().min(1),
      fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
      genero: generoPacienteSchema,
      documentoId: z.string().optional(),
      email: optionalEmail,
      telefono: z.string().optional(),
      estado: estadoPacienteSchema.optional(),
    })
  ).min(1, 'Debe haber al menos un paciente para importar'),
});

// Schema para búsqueda de pacientes
export const searchPacientesSchema = z.object({
  q: z.string().optional(),
  estado: estadoPacienteSchema.optional(),
  riesgo: riesgoPacienteSchema.optional(),
  profesionalReferenteId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  cursor: z.string().optional(),
});

// Schema para agregar entrada al historial clínico
export const addHistorialEntrySchema = z.object({
  tipo: z.enum(['nota', 'diagnostico', 'tratamiento', 'consulta', 'seguimiento', 'alta']),
  titulo: z.string().min(1, 'El título es requerido').max(200),
  contenido: z.string().min(1, 'El contenido es requerido').max(5000),
  profesionalId: z.string().optional(),
  adjuntos: optionalArray(
    z.object({
      nombre: z.string().min(1),
      url: z.string().url('URL inválida'),
      tipo: z.string(),
    })
  ),
});

// Schema para eliminar entrada del historial
export const deleteHistorialEntrySchema = z.object({
  entryId: z.string().min(1, 'El ID de la entrada es requerido'),
});

// Tipos inferidos
export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;
export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;
export type ImportPacientesInput = z.infer<typeof importPacientesSchema>;
export type SearchPacientesInput = z.infer<typeof searchPacientesSchema>;
export type AddHistorialEntryInput = z.infer<typeof addHistorialEntrySchema>;
