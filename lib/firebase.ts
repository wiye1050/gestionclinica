import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase solo una vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firestore con ignoreUndefinedProperties una sola vez
const globalForFirestore = globalThis as typeof globalThis & {
  _firestore?: ReturnType<typeof getFirestore>;
  _firestoreInitialized?: boolean;
};

if (!globalForFirestore._firestoreInitialized) {
  try {
    globalForFirestore._firestore = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
  } catch {
    // ya estaba inicializado
    globalForFirestore._firestore = getFirestore(app);
  }
  globalForFirestore._firestoreInitialized = true;
}

const db = globalForFirestore._firestore ?? getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Inicializar App Check (solo en producción o con reCAPTCHA key)
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.warn('App Check initialization failed:', error);
  }
}

export { app, db, auth, storage };
