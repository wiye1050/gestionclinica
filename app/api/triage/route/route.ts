import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';
import { applyEpisodeTransition } from '@/lib/episodes/applyEvent';

const routeSchema = z.object({
  episodeId: z.string().min(1, 'episodeId requerido'),
  assignedToUserId: z.string().min(1, 'Debe asignarse un responsable'),
  notes: z.string().max(500).optional(),
  priority: z.enum(['normal', 'alta']).default('normal'),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const allowed = hasRole(currentUser.roles, 'coordinacion') || hasRole(currentUser.roles, 'admin');
  if (!allowed) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = routeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no configurado en el servidor' },
      { status: 500 }
    );
  }

  const { episodeId, assignedToUserId, notes, priority } = parsed.data;

  try {
    const taskRef = await adminDb.collection('tasks').add({
      type: 'SCHEDULING_ORDER',
      episodeId,
      assignedToUserId,
      notes: notes ?? null,
      priority,
      status: 'pending',
      createdAt: Date.now(),
      createdBy: currentUser.uid,
    });

    await emitEvent({
      type: 'Triage.Routed',
      subject: { kind: 'episode', id: episodeId },
      actorUserId: currentUser.uid,
      meta: {
        assignedToUserId,
        taskId: taskRef.id,
        priority,
      },
    });

    await applyEpisodeTransition({
      episodeId,
      trigger: 'Triage.Routed',
      actorUserId: currentUser.uid,
    });

    return NextResponse.json(
      {
        taskId: taskRef.id,
        episodeId,
        assignedToUserId,
        priority,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[triage.route] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo enrutar el triaje';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
