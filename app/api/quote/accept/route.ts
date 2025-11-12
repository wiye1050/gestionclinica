import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';
import { applyEpisodeTransition } from '@/lib/episodes/applyEvent';

const acceptSchema = z.object({
  episodeId: z.string().min(1),
  quoteId: z.string().min(1),
  acceptedBy: z.string().optional(),
  signatureUrl: z.string().url().optional(),
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
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no configurado en el servidor' },
      { status: 500 }
    );
  }

  const { episodeId, quoteId, acceptedBy, signatureUrl } = parsed.data;

  try {
    const consentSnap = await adminDb
      .collection('consents')
      .where('episodeId', '==', episodeId)
      .where('type', '==', 'SPECIFIC')
      .limit(1)
      .get();

    if (consentSnap.empty) {
      return NextResponse.json(
        { error: 'Se requiere un consentimiento específico firmado antes de aceptar el presupuesto' },
        { status: 400 }
      );
    }

    const quoteRef = adminDb.collection('episodes').doc(episodeId).collection('quote').doc(quoteId);
    await quoteRef.set(
      {
        status: 'ACCEPTED',
        totalAcceptedAt: Date.now(),
        signedAt: Date.now(),
        acceptedBy: acceptedBy ?? null,
        signatureUrl: signatureUrl ?? null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    await emitEvent({
      type: 'Quote.Accepted',
      subject: { kind: 'quote', id: quoteId },
      actorUserId: currentUser.uid,
      meta: {
        episodeId,
        consentId: consentSnap.docs[0].id,
        acceptedBy,
      },
    });

    await applyEpisodeTransition({
      episodeId,
      trigger: 'Quote.Accepted',
      actorUserId: currentUser.uid,
      context: {
        hasSpecificConsent: true,
        quoteStatus: 'ACCEPTED',
      },
      meta: { quoteId },
    });

    return NextResponse.json(
      {
        quoteId,
        episodeId,
        status: 'ACCEPTED',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[quote.accept] Error', error);
    const message =
      error instanceof Error ? error.message : 'No se pudo aceptar el presupuesto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
