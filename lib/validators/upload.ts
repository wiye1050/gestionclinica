import { z } from 'zod';

/**
 * Validadores para el módulo de Upload de Archivos
 */

// Tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'text/csv',
] as const;

// Tamaño máximo: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Carpetas permitidas
export const folderSchema = z.enum([
  'general',
  'pacientes',
  'documentos',
  'formularios',
  'protocolos',
  'informes',
  'imagenes',
  'temp',
]);

// Schema para validar el upload
export const uploadFileSchema = z.object({
  file: z.instanceof(File, { message: 'Debe proporcionar un archivo' }),
  folder: folderSchema.default('general'),
});

// Schema para validar metadata del archivo
export const validateFileMetadataSchema = z.object({
  filename: z
    .string()
    .min(1, 'El nombre del archivo es requerido')
    .max(255, 'Nombre de archivo muy largo')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Nombre de archivo inválido (solo letras, números, guiones, puntos)'),
  contentType: z.string().refine(
    (val) => ALLOWED_FILE_TYPES.includes(val as typeof ALLOWED_FILE_TYPES[number]),
    { message: 'Tipo de archivo no permitido' }
  ),
  size: z
    .number()
    .int()
    .positive('El tamaño debe ser positivo')
    .max(MAX_FILE_SIZE, `El archivo no puede superar ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  folder: folderSchema,
});

// Helper para validar extensión de archivo
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// Helper para obtener content type desde extensión
export const getContentTypeFromExtension = (ext: string): string | null => {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
  };
  return mimeTypes[ext] || null;
};

// Tipos inferidos
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type ValidateFileMetadataInput = z.infer<typeof validateFileMetadataSchema>;
export type AllowedFolder = z.infer<typeof folderSchema>;
