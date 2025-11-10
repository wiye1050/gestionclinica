import { bucket } from './client';

// Configuración de seguridad
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function uploadFile(
  file: File,
  folder: string = 'general'
): Promise<string> {
  // Validaciones de seguridad
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Archivo demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}`);
  }

  // Sanitizar nombre de archivo
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const fileName = `${folder}/${timestamp}-${sanitizedName}`;

  const blob = bucket.file(fileName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await blob.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  // ⚠️ NO hacer público el archivo - usar signed URL privada
  // await blob.makePublic(); // ELIMINADO por seguridad

  // Retornar signed URL con expiración de 7 días
  const [url] = await blob.getSignedUrl({
    action: 'read',
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días
  });

  return url;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  const fileName = fileUrl.split(`${bucket.name}/`)[1];
  await bucket.file(fileName).delete();
}

export async function listFiles(folder?: string): Promise<string[]> {
  const [files] = await bucket.getFiles({
    prefix: folder,
  });

  return files.map((file) => file.name);
}
