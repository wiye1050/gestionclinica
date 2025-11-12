import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';

const submitSchema = z.object({
  episodeId: z.string().min(1),
  submittedBy: z.enum(['PATIENT', 'CLINICIAN']).default('CLINICIAN'),
  channel: z.enum(['WEB', 'PHONE', 'WHATSAPP', 'REFERRAL']).default('WEB'),
  formSchemaKey: z.string().min(1),
  answers: z.record(z.string(), z.any()).default({}),
  riskFlags: z.array(z.string().max(40)).max(10).optional(),
  reportUrl: z.string().url().optional(),
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
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { episodeId, submittedBy, channel, formSchemaKey, answers, riskFlags = [], reportUrl } = parsed.data;

  try {
    const triageRef = await adminDb.collection('episodes').doc(episodeId).collection('triage').add({
      submittedBy,
      channel,
      formSchemaKey,
      answers,
      riskFlags,
      reportUrl: reportUrl ?? null,
      createdAt: Date.now(),
      createdBy: currentUser.uid,
    });

    if (riskFlags.length > 0) {
      await adminDb.collection('episodes').doc(episodeId).set(
        {
          riskFlags,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }

    await emitEvent({
      type: 'Triage.Submitted',
      subject: { kind: 'episode', id: episodeId },
      actorUserId: currentUser.uid,
      meta: {
        triageId: triageRef.id,
        formSchemaKey,
        riskFlags,
      },
    });

    return NextResponse.json(
      {
        triageId: triageRef.id,
        episodeId,
        riskFlags,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[triage.submit] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo registrar el triaje';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
