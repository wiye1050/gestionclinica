import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';
import { applyEpisodeTransition } from '@/lib/episodes/applyEvent';

const planSchema = z.object({
  episodeId: z.string().min(1),
  protocolKey: z.string().min(1),
  sessionsPlanned: z.number().int().positive(),
  sessionsDone: z.number().int().nonnegative().default(0),
  materials: z
    .array(
      z.object({
        sku: z.string().min(1),
        qty: z.number().positive(),
      })
    )
    .default([]),
  consentsRequired: z.array(z.string().min(1)).default([]),
  priceTotal: z.number().positive().optional(),
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

  const body = await request.json();
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no configurado en el servidor' },
      { status: 500 }
    );
  }

  const { episodeId, protocolKey, sessionsPlanned, sessionsDone, materials, consentsRequired, priceTotal } =
    parsed.data;

  try {
    const planRef = adminDb.collection('episodes').doc(episodeId).collection('plan').doc();
    const payload = {
      protocolKey,
      sessionsPlanned,
      sessionsDone,
      materials,
      consentsRequired,
      priceTotal: priceTotal ?? null,
      status: 'PROPOSED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser.uid,
    };

    await planRef.set(payload);

    await emitEvent({
      type: 'Plan.Proposed',
      subject: { kind: 'plan', id: planRef.id },
      actorUserId: currentUser.uid,
      meta: {
        episodeId,
        protocolKey,
        sessionsPlanned,
      },
    });

    await applyEpisodeTransition({
      episodeId,
      trigger: 'Plan.Proposed',
      actorUserId: currentUser.uid,
      meta: { planId: planRef.id, protocolKey },
    });

    return NextResponse.json(
      {
        planId: planRef.id,
        episodeId,
        status: 'PROPOSED',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[plan.propose] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo proponer el plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
