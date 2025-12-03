import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { logger } from '@/lib/utils/logger';

const BATCH_LIMIT = 50;

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }
  if (!hasRole(currentUser.roles, 'admin')) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  if (!adminDb || !adminStorage) {
    return NextResponse.json(
      { error: 'Firebase Admin no está configurado.' },
      { status: 500 }
    );
  }

  const bucket = adminStorage.bucket();
  const nowTs = Timestamp.fromDate(new Date());

  let processed = 0;
  let cleanedFiles = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (processed < BATCH_LIMIT) {
    let query = adminDb
      .collection('pacientes-historial')
      .where('linkExpiresAt', '<=', nowTs)
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
      const adjuntos = Array.isArray(data.adjuntos) ? data.adjuntos : [];
      if (adjuntos.length === 0) {
        continue;
      }

      const metadata = Array.isArray(data.adjuntosMetadata) ? data.adjuntosMetadata : [];
      for (const url of adjuntos) {
        let storagePath: string | undefined =
          metadata.find((item) => item?.url === url)?.storagePath ?? undefined;

        if (!storagePath) {
          try {
            const parsedUrl = new URL(url);
            storagePath = decodeURIComponent(parsedUrl.pathname.replace(/^\/|^\/v0\/b\/[^/]+\/o\//, ''));
            const mediaPathMatch = parsedUrl.pathname.match(/\/o\/([^?]+)/);
            if (mediaPathMatch) {
              storagePath = decodeURIComponent(mediaPathMatch[1]);
            }
          } catch {
            storagePath = undefined;
          }
        }

        if (storagePath) {
          try {
            await bucket.file(storagePath).delete({ ignoreNotFound: true });
            cleanedFiles += 1;
          } catch (error) {
            logger.warn('No se pudo eliminar', { storagePath, error: error instanceof Error ? error.message : String(error) });
          }
        }
      }

      await docSnap.ref.update({
        adjuntos: [],
        adjuntosMetadata: [],
        planesSeguimiento: data.planesSeguimiento ?? 'Regenerar y reenviar si es necesario',
        descripcion: data.descripcion
          ? `${data.descripcion} (enlace expirado)`
          : 'Enlace expirado automáticamente.',
        linkExpiresAt: null,
        cleanedAt: new Date(),
      });
      processed += 1;

      if (processed >= BATCH_LIMIT) break;
    }
  }

  return NextResponse.json({
    processed,
    cleanedFiles,
  });
}
