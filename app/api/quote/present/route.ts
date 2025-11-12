import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';

const quoteItemSchema = z.object({
  label: z.string().min(1),
  qty: z.number().positive(),
  price: z.number().nonnegative(),
});

const presentSchema = z.object({
  episodeId: z.string().min(1),
  quoteId: z.string().optional(),
  items: z.array(quoteItemSchema).min(1),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const allowed = hasRole(currentUser.roles, 'admin') || hasRole(currentUser.roles, 'coordinacion');
  if (!allowed) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const body = await request.json();
  const parsed = presentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { episodeId, quoteId, items, notes } = parsed.data;
  const total = items.reduce((acc, item) => acc + item.qty * item.price, 0);

  try {
    const collectionRef = adminDb.collection('episodes').doc(episodeId).collection('quote');
    const quoteRef = quoteId ? collectionRef.doc(quoteId) : collectionRef.doc();

    await quoteRef.set(
      {
        items,
        total,
        status: 'PRESENTED',
        notes: notes ?? null,
        presentedAt: Date.now(),
        updatedAt: Date.now(),
        presentedBy: currentUser.uid,
      },
      { merge: true }
    );

    await emitEvent({
      type: 'Quote.Presented',
      subject: { kind: 'quote', id: quoteRef.id },
      actorUserId: currentUser.uid,
      meta: {
        episodeId,
        total,
        items: items.length,
      },
    });

    return NextResponse.json(
      {
        quoteId: quoteRef.id,
        status: 'PRESENTED',
        total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[quote.present] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo registrar el presupuesto';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
