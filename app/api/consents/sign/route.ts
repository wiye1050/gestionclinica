import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';
import { applyEpisodeTransition } from '@/lib/episodes/applyEvent';

const consentSchema = z.object({
  patientId: z.string().min(1),
  episodeId: z.string().optional(),
  type: z.enum(['BASE', 'SPECIFIC']),
  version: z.string().min(1),
  signer: z.object({
    name: z.string().min(1),
    docId: z.string().optional(),
  }),
  fileUrl: z.string().url().optional(),
  source: z.enum(['PATIENT', 'CLINIC']).default('CLINIC'),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no configurado en el servidor' },
      { status: 500 }
    );
  }

  const { patientId, episodeId, type, version, signer, fileUrl, source } = parsed.data;

  try {
    const consentRef = await adminDb.collection('consents').add({
      patientId,
      episodeId: episodeId ?? null,
      type,
      version,
      signer,
      fileUrl: fileUrl ?? null,
      signedAt: Date.now(),
      source,
      createdBy: currentUser.uid,
    });

    const eventType =
      type === 'BASE' ? 'Consent.Signed.Base' : 'Consent.Signed.Specific';

    await emitEvent({
      type: eventType,
      subject: { kind: 'patient', id: patientId },
      actorUserId: currentUser.uid,
      meta: {
        consentId: consentRef.id,
        episodeId,
        version,
        source,
      },
    });

    if (type === 'BASE' && episodeId) {
      await applyEpisodeTransition({
        episodeId,
        trigger: 'Consent.Signed.Base',
        actorUserId: currentUser.uid,
        context: { hasBaseConsent: true },
        meta: { consentId: consentRef.id },
      });
    }

    return NextResponse.json(
      {
        consentId: consentRef.id,
        type,
        version,
        patientId,
        episodeId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[consents.sign] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo registrar el consentimiento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
