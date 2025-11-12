import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';

const bookSchema = z
  .object({
    episodeId: z.string().min(1),
    patientId: z.string().min(1),
    professionalId: z.string().min(1),
    roomId: z.string().optional(),
    start: z.number().int().positive(),
    end: z.number().int().positive(),
    tipo: z.string().default('consulta'),
    notas: z.string().max(500).optional(),
  })
  .refine((data) => data.end > data.start, { message: 'La hora de fin debe ser posterior al inicio', path: ['end'] });

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
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { episodeId, patientId, professionalId, roomId, start, end, tipo, notas } = parsed.data;

  try {
    const appointmentRef = await adminDb.collection('appointments').add({
      episodeId,
      patientId,
      professionalId,
      roomId: roomId ?? null,
      start,
      end,
      status: 'BOOKED',
      tipo,
      notas: notas ?? null,
      createdAt: Date.now(),
      createdBy: currentUser.uid,
    });

    await emitEvent({
      type: 'Appointment.Booked',
      subject: { kind: 'appointment', id: appointmentRef.id },
      actorUserId: currentUser.uid,
      meta: {
        episodeId,
        patientId,
        professionalId,
        start,
      },
    });

    return NextResponse.json(
      {
        appointmentId: appointmentRef.id,
        status: 'BOOKED',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[appointments.book] Error', error);
    const message = error instanceof Error ? error.message : 'No se pudo crear la cita';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
