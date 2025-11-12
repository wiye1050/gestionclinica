import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';

const scheduleSchema = z.object({
  episodeId: z.string().min(1),
  date: z.number().int().positive(),
  kind: z.enum(['REVIEW', 'PROs']),
  scores: z.record(z.string(), z.number()).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const allowed =
    hasRole(currentUser.roles, 'admin') ||
    hasRole(currentUser.roles, 'coordinacion') ||
    hasRole(currentUser.roles, 'terapeuta');

  if (!allowed) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const body = await request.json();
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { episodeId, date, kind, scores, notes } = parsed.data;

  try {
    const followUpRef = await adminDb.collection('episodes').doc(episodeId).collection('followups').add({
      date,
      kind,
      scores: scores ?? null,
      notes: notes ?? null,
      status: 'PENDING',
      createdAt: Date.now(),
      createdBy: currentUser.uid,
    });

    await emitEvent({
      type: 'FollowUp.Scheduled',
      subject: { kind: 'episode', id: episodeId },
      actorUserId: currentUser.uid,
      meta: {
        followUpId: followUpRef.id,
        kind,
        date,
      },
    });

    return NextResponse.json(
      {
        followUpId: followUpRef.id,
        date,
        kind,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[followups.schedule] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo programar el seguimiento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
