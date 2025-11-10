import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type ServiceAccountConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function readServiceAccount(): ServiceAccountConfig | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: (parsed.private_key as string).replace(/\\n/g, '\n'),
      };
    } catch (error) {
      console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON', error);
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

let adminApp: App | null = null;

const serviceAccount = readServiceAccount();

if (serviceAccount) {
  const existing = getApps();
  adminApp =
    existing.length > 0
      ? existing[0]
      : initializeApp({
          credential: cert({
            projectId: serviceAccount.projectId,
            clientEmail: serviceAccount.clientEmail,
            privateKey: serviceAccount.privateKey,
          }),
        });
} else if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'Firebase Admin no está configurado. Define FIREBASE_SERVICE_ACCOUNT_KEY o las variables FIREBASE_ADMIN_* para habilitar la verificación de sesiones.'
  );
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;

let adminDbInstance: ReturnType<typeof getFirestore> | null = null;
let adminDbSettingsApplied = false;

if (adminApp) {
  adminDbInstance = getFirestore(adminApp);
  if (!adminDbSettingsApplied && adminDbInstance) {
    adminDbInstance.settings({ ignoreUndefinedProperties: true });
    adminDbSettingsApplied = true;
  }
}

export const adminDb = adminDbInstance;
