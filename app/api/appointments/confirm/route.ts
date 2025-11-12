import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';
import { applyEpisodeTransition } from '@/lib/episodes/applyEvent';

const confirmSchema = z.object({
  appointmentId: z.string().min(1),
  episodeId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const canConfirm =
    hasRole(currentUser.roles, 'admin') ||
    hasRole(currentUser.roles, 'coordinacion') ||
    hasRole(currentUser.roles, 'terapeuta');
  if (!canConfirm) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no configurado en el servidor' },
      { status: 500 }
    );
  }

  const { appointmentId, episodeId, notes } = parsed.data;

  try {
    const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
    await appointmentRef.set(
      {
        episodeId,
        status: 'CONFIRMED',
        confirmedAt: Date.now(),
        notes: notes ?? null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    await emitEvent({
      type: 'Appointment.Confirmed',
      subject: { kind: 'appointment', id: appointmentId },
      actorUserId: currentUser.uid,
      meta: {
        episodeId,
      },
    });

    await applyEpisodeTransition({
      episodeId,
      trigger: 'Appointment.Confirmed',
      actorUserId: currentUser.uid,
      meta: { appointmentId },
    });

    return NextResponse.json(
      {
        appointmentId,
        episodeId,
        status: 'CONFIRMED',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[appointments.confirm] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo confirmar la cita';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
