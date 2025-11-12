import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';

const inventoryMovementSchema = z.object({
  sku: z.string().min(1),
  qty: z.number().positive(),
  batch: z.string().optional(),
});

const completeSchema = z.object({
  episodeId: z.string().min(1),
  procedureId: z.string().min(1),
  notes: z.string().max(500).optional(),
  checklist: z
    .array(
      z.object({
        key: z.string().min(1),
        done: z.boolean(),
        note: z.string().optional(),
      })
    )
    .optional(),
  inventoryMovements: z.array(inventoryMovementSchema).optional(),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const allowed =
    hasRole(currentUser.roles, 'admin') ||
    hasRole(currentUser.roles, 'doctor') ||
    hasRole(currentUser.roles, 'terapeuta');

  if (!allowed) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const body = await request.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { episodeId, procedureId, notes, checklist, inventoryMovements = [] } = parsed.data;

  try {
    const procedureRef = adminDb.collection('episodes').doc(episodeId).collection('procedures').doc(procedureId);
    await procedureRef.set(
      {
        status: 'COMPLETED',
        completedAt: Date.now(),
        notes: notes ?? null,
        checklist: checklist ?? null,
        updatedAt: Date.now(),
        completedBy: currentUser.uid,
      },
      { merge: true }
    );

    await emitEvent({
      type: 'Procedure.Completed',
      subject: { kind: 'procedure', id: procedureId },
      actorUserId: currentUser.uid,
      meta: {
        episodeId,
        inventoryMovements: inventoryMovements.length,
      },
    });

    for (const movement of inventoryMovements) {
      await emitEvent({
        type: 'Inventory.Deducted',
        subject: { kind: 'procedure', id: procedureId },
        actorUserId: currentUser.uid,
        meta: {
          episodeId,
          sku: movement.sku,
          qty: movement.qty,
          batch: movement.batch ?? null,
        },
      });
    }

    return NextResponse.json(
      {
        procedureId,
        status: 'COMPLETED',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[procedures.complete] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo completar el procedimiento';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
