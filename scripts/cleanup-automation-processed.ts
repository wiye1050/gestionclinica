import 'dotenv/config';
import admin from 'firebase-admin';

function bootstrapFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'Define FIREBASE_SERVICE_ACCOUNT_KEY o las variables FIREBASE_ADMIN_* antes de ejecutar este script.'
    );
  }

  const parsed = JSON.parse(raw);
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    }),
  });
}

async function main() {
  const days = Number(process.env.CLEANUP_DAYS ?? '30');
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const app = bootstrapFirebase();
  const db = app.firestore();

  console.log(`[cleanup] Eliminando registros anteriores a ${new Date(cutoff).toISOString()}`);

  const snapshot = await db
    .collection('automation-processed')
    .where('processedAt', '<', cutoff)
    .limit(500)
    .get();

  if (snapshot.empty) {
    console.log('[cleanup] No hay documentos antiguos para borrar.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`[cleanup] Se eliminaron ${snapshot.size} documentos.`);
}

void main().catch((error) => {
  console.error('[cleanup] Error durante la limpieza', error);
  process.exitCode = 1;
});
