import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { hasRole } from '@/lib/auth/roles';
import { adminDb } from '@/lib/firebaseAdmin';
import { emitEvent } from '@/lib/events/emit';
import { applyEpisodeTransition } from '@/lib/episodes/applyEvent';

const leadSchema = z
  .object({
    patientId: z.string().optional(),
    patient: z
      .object({
        fullName: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        dob: z.string().optional(),
        tags: z.array(z.string().max(40)).max(10).optional(),
      })
      .optional(),
    channel: z.enum(['WEB', 'PHONE', 'WHATSAPP', 'REFERRAL']),
    tags: z.array(z.string().max(40)).max(10).optional(),
    reason: z.string().max(500).optional(),
    autoQualify: z.boolean().optional(),
  })
  .refine(
    (input) => Boolean(input.patientId || input.patient),
    'Debe proporcionar patientId o los datos básicos del paciente'
  );

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const canManageLeads = hasRole(currentUser.roles, 'admin') || hasRole(currentUser.roles, 'coordinacion');
  if (!canManageLeads) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const body = await request.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { patientId: providedPatientId, patient, channel, tags = [], reason, autoQualify } = parsed.data;

  try {
    let patientId = providedPatientId ?? null;

    if (!patientId && patient) {
      const patientRef = await adminDb.collection('patients').add({
        fullName: patient.fullName,
        telefono: patient.phone ?? null,
        email: patient.email ?? null,
        fechaNacimiento: patient.dob ?? null,
        tags: patient.tags ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: channel,
      });
      patientId = patientRef.id;
    }

    if (!patientId) {
      return NextResponse.json({ error: 'No se pudo determinar el paciente' }, { status: 400 });
    }

    const episodeRef = await adminDb.collection('episodes').add({
      patientId,
      state: 'CAPTACION',
      reason: reason ?? null,
      tags,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      ownerUserId: currentUser.uid,
    });

    const leadRef = await adminDb.collection('leads').add({
      patientId,
      episodeId: episodeRef.id,
      channel,
      tags,
      reason: reason ?? null,
      createdAt: Date.now(),
      createdBy: currentUser.uid,
    });

    await emitEvent({
      type: 'Lead.Created',
      subject: { kind: 'episode', id: episodeRef.id },
      actorUserId: currentUser.uid,
      meta: {
        patientId,
        channel,
        leadId: leadRef.id,
      },
    });

    if (autoQualify) {
      await applyEpisodeTransition({
        episodeId: episodeRef.id,
        trigger: 'Lead.Qualified',
        actorUserId: currentUser.uid,
      });
    }

    return NextResponse.json(
      {
        leadId: leadRef.id,
        episodeId: episodeRef.id,
        patientId,
        state: autoQualify ? 'TRIAJE' : 'CAPTACION',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[leads] Error creando lead', error);
    const message = error instanceof Error ? error.message : 'No se pudo crear el lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
