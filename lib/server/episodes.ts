import { adminDb } from '@/lib/firebaseAdmin';
import type { CanonicalEvent, EpisodeWithPatient, Patient } from '@/types/episode';

const DEFAULT_LIMIT = 60;

export async function getEpisodesForKanban(limit = DEFAULT_LIMIT): Promise<EpisodeWithPatient[]> {
  const db = adminDb;
  if (!db) {
    throw new Error('Firebase Admin no está configurado');
  }

  const snapshot = await db
    .collection('episodes')
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  const episodes = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<EpisodeWithPatient, 'patient'>;
    return {
      ...data,
      id: doc.id,
    };
  });

  const patientIds = Array.from(new Set(episodes.map((ep) => ep.patientId))).filter(Boolean);
  const patientMap = new Map<string, Patient>();

  if (patientIds.length > 0) {
    const patientSnaps = await Promise.all(
      patientIds.map((id) => db.collection('patients').doc(id).get())
    );
    patientSnaps.forEach((snap) => {
      if (snap.exists) {
        const data = snap.data() as Record<string, unknown>;
        const fallbackName = [data.nombre, data.apellidos].filter(Boolean).join(' ').trim();
        patientMap.set(snap.id, {
          id: snap.id,
          fullName: (data.fullName as string | undefined) ?? (fallbackName || 'Paciente'),
          phone: data.telefono as string | undefined,
          email: data.email as string | undefined,
          tags: (data.tags as string[]) ?? [],
          createdAt: (data.createdAt as number | undefined) ?? Date.now(),
        });
      }
    });
  }

  return episodes.map((episode) => ({
    ...episode,
    patient: patientMap.get(episode.patientId),
  }));
}

export async function getEpisodeById(id: string): Promise<EpisodeWithPatient | null> {
  const db = adminDb;
  if (!db) {
    throw new Error('Firebase Admin no está configurado');
  }
  const episodeSnap = await db.collection('episodes').doc(id).get();
  if (!episodeSnap.exists) {
    return null;
  }
  const episode = {
    ...(episodeSnap.data() as Omit<EpisodeWithPatient, 'patient'>),
    id: episodeSnap.id,
  };
  const patientSnap = await db.collection('patients').doc(episode.patientId).get();
  return {
    ...episode,
    patient: patientSnap.exists
      ? (() => {
          const data = patientSnap.data() as Record<string, unknown>;
          const fallbackName = [data.nombre, data.apellidos].filter(Boolean).join(' ').trim();
          const patient: Patient = {
            id: patientSnap.id,
            fullName: (data.fullName as string | undefined) ?? (fallbackName || 'Paciente'),
            phone: data.telefono as string | undefined,
            email: data.email as string | undefined,
            tags: (data.tags as string[]) ?? [],
            createdAt: (data.createdAt as number | undefined) ?? Date.now(),
          };
          return patient;
        })()
      : undefined,
  };
}

export async function getEpisodeEvents(
  episodeId: string,
  limit = 200
): Promise<CanonicalEvent[]> {
  const db = adminDb;
  if (!db) {
    throw new Error('Firebase Admin no está configurado');
  }

  const snapshot = await db
    .collection('events')
    .where('subject.id', '==', episodeId)
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as CanonicalEvent),
  }));
}
