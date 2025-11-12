import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { applyEpisodeTransition } from '@/lib/episodes/applyEvent';
import { emitEvent } from '@/lib/events/emit';

const dischargeSchema = z.object({
  episodeId: z.string().min(1),
  reason: z.string().max(500).optional(),
  metrics: z.record(z.string(), z.number()).optional(),
  recallDate: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const allowed = hasRole(currentUser.roles, 'admin') || hasRole(currentUser.roles, 'coordinacion') || hasRole(currentUser.roles, 'doctor');
  if (!allowed) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const body = await request.json();
  const parsed = dischargeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { episodeId, reason, metrics, recallDate } = parsed.data;

  try {
    await adminDb.collection('episodes').doc(episodeId).set(
      {
        closedAt: Date.now(),
        dischargeReason: reason ?? null,
        dischargeMetrics: metrics ?? null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    const transition = await applyEpisodeTransition({
      episodeId,
      trigger: 'Episode.Closed',
      actorUserId: currentUser.uid,
      context: { dischargeReady: true },
      meta: { reason },
    });

    await emitEvent({
      type: 'Episode.Closed',
      subject: { kind: 'episode', id: episodeId },
      actorUserId: currentUser.uid,
      meta: {
        reason,
        metrics,
      },
    });

    if (recallDate) {
      await adminDb.collection('episodes').doc(episodeId).set(
        {
          recallDate,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      await applyEpisodeTransition({
        episodeId,
        trigger: 'Recall.Scheduled',
        actorUserId: currentUser.uid,
        context: { recallScheduled: true },
        meta: { recallDate },
      });
    }

    return NextResponse.json(
      {
        episodeId,
        state: transition.nextState,
        recallDate: recallDate ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[episodes.discharge] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo cerrar el episodio';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
