import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function purgeExpiredHistory() {
  const now = new Date();
  const snapshot = await getDocs(
    query(collection(db, 'pacientes-historial'), where('adjuntos', '!=', []))
  );

  let purged = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const adjuntos = (data.adjuntos as string[]) || [];
    const descripcion = data.descripcion as string | undefined;

    if (!descripcion) continue;
    const match = descripcion.match(/Enlace disponible hasta (.*)\./);
    if (!match) continue;

    const expiresAt = new Date(match[1]);
    if (isNaN(expiresAt.getTime()) || expiresAt > now) {
      continue;
    }

    for (const url of adjuntos) {
      try {
        const path = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
        await deleteObject(ref(storage, path));
      } catch (err) {
        console.error('Error deleting', url, err);
      }
    }

    await updateDoc(docSnap.ref, {
      descripcion: `${descripcion} (enlace expirado)`,
      adjuntos: [],
      planesSeguimiento: 'Regenerar y reenviar si es necesario',
      actualizadoPorFuncion: now.toISOString(),
    });
    purged += 1;
  }

  console.log(`Expedientes depurados: ${purged}`);
}

purgeExpiredHistory()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
