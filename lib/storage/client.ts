import { Storage } from '@google-cloud/storage';
import { logger } from '@/lib/utils/logger';

// Configuración segura de Google Cloud Storage usando variables de entorno
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'delta-vertex-476113-u7';
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'gestionclinica-archivos';

// Inicializar Storage con credenciales seguras
let storage: Storage;

if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  // Opción 1: Credenciales como JSON string (RECOMENDADO para producción)
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    storage = new Storage({
      projectId,
      credentials,
    });
  } catch (error) {
    logger.error('Error parsing GOOGLE_CLOUD_CREDENTIALS:', error);
    throw new Error('Invalid GOOGLE_CLOUD_CREDENTIALS format. Must be valid JSON.');
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Opción 2: Path a archivo de credenciales (solo desarrollo local)
  storage = new Storage({
    projectId,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
} else {
  // Fallback: Usar credenciales por defecto de la aplicación (ADC)
  // Esto funciona automáticamente en Google Cloud Run, App Engine, etc.
  logger.warn('No Google Cloud credentials found. Using Application Default Credentials (ADC).');
  storage = new Storage({ projectId });
}

const bucket = storage.bucket(bucketName);

export { storage, bucket };
