import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const BATCH_LIMIT = 50;

const decodeStoragePath = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    const mediaMatch = parsed.pathname.match(/\/o\/([^?]+)/);
    if (mediaMatch && mediaMatch[1]) {
      return decodeURIComponent(mediaMatch[1]);
    }
    const cleaned = parsed.pathname.replace(/^\/+/, '');
    return decodeURIComponent(cleaned);
  } catch {
    return undefined;
  }
};

export const purgeExpiredHistory = onSchedule(
  { schedule: 'every 24 hours' },
  async () => {
  const now = Timestamp.now();
  let processed = 0;
  let cleanedFiles = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (processed < BATCH_LIMIT) {
    let query = db
      .collection('pacientes-historial')
      .where('linkExpiresAt', '<=', now)
      .orderBy('linkExpiresAt', 'asc')
      .limit(BATCH_LIMIT - processed);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const docSnap of snapshot.docs) {
      lastDoc = docSnap;
      const data = docSnap.data() ?? {};
      const adjuntos: string[] = Array.isArray(data.adjuntos) ? data.adjuntos : [];
      if (adjuntos.length === 0) {
        continue;
      }

      const metadata: Array<{ url?: string; storagePath?: string }> = Array.isArray(
        data.adjuntosMetadata
      )
        ? data.adjuntosMetadata
        : [];

      for (const url of adjuntos) {
        if (typeof url !== 'string') continue;
        const storagePath =
          metadata.find((item) => item?.url === url)?.storagePath ?? decodeStoragePath(url);
        if (!storagePath) continue;
        try {
          await bucket.file(storagePath).delete({ ignoreNotFound: true });
          cleanedFiles += 1;
        } catch (error) {
          logger.warn('No se pudo eliminar el archivo', storagePath, error);
        }
      }

      await docSnap.ref.update({
        adjuntos: [],
        adjuntosMetadata: [],
        descripcion: data.descripcion
          ? `${data.descripcion} (enlace expirado)`
          : 'Enlace expirado automáticamente.',
        linkExpiresAt: null,
        cleanedAt: FieldValue.serverTimestamp(),
      });
      processed += 1;
      if (processed >= BATCH_LIMIT) {
        break;
      }
    }
  }

  logger.info('Purge expired history completado', { processed, cleanedFiles });
});
