import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import type { EpisodeState } from '@/types/constants';

const DEFAULT_LIMIT = 60;

export async function GET(request: Request) {
  const db = adminDb;
  if (!db) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const url = new URL(request.url);
  const state = url.searchParams.get('state') as EpisodeState | null;
  const limitParam = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : DEFAULT_LIMIT;

  try {
    let query = db.collection('episodes').orderBy('updatedAt', 'desc').limit(limit);
    if (state) {
      query = db.collection('episodes').where('state', '==', state).orderBy('updatedAt', 'desc').limit(limit);
    }

    const snapshot = await query.get();
    const episodes = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown> & { patientId?: string };
      return {
        ...data,
        id: doc.id,
      };
    });

    const patientIds = Array.from(
      new Set(episodes.map((episode) => episode.patientId).filter((id): id is string => Boolean(id)))
    );
    const patientMap = new Map<string, Record<string, unknown>>();

    if (patientIds.length > 0) {
      const patientSnaps = await Promise.all(patientIds.map((patientId) => db.collection('patients').doc(patientId).get()));

      patientSnaps.forEach((snap) => {
        if (snap.exists) {
          patientMap.set(snap.id, snap.data() as Record<string, unknown>);
        }
      });
    }

    const payload = episodes.map((episode) => ({
      ...episode,
      patient: episode.patientId ? patientMap.get(episode.patientId) : undefined,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('[episodios] Error obteniendo episodios', error);
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los episodios';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
