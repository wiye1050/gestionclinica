import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const db = adminDb;
  if (!db) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const { id: episodeId } = await context.params;
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 200;

  try {
    const snapshot = await db
      .collection('events')
      .where('subject.id', '==', episodeId)
      .orderBy('timestamp', 'asc')
      .limit(limit)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }));

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error('[episode.events] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los eventos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
