"use server";

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { logAudit } from '@/lib/utils/audit';
import { revalidatePath } from 'next/cache';
import { addPacienteHistorial } from '@/lib/server/pacientesAdmin';
import { logger } from '@/lib/utils/logger';

const resolverSchema = z.object({
  pacienteId: z.string().min(1)
});

export async function resolverSeguimientoAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión.');
  }

  const parsed = resolverSchema.safeParse({ pacienteId: formData.get('pacienteId') });
  if (!parsed.success) {
    throw new Error('Paciente no válido.');
  }

  try {
    await addPacienteHistorial(
      parsed.data.pacienteId,
      {
        tipo: 'seguimiento',
        descripcion: 'Seguimiento resuelto por coordinación.',
        planesSeguimiento: null,
      },
      { email: user.email, uid: user.uid }
    );

    await logAudit({
      actorUid: user.uid,
      actorNombre: user.displayName ?? user.email,
      modulo: 'pacientes',
      accion: 'resolver-seguimiento',
      entidadId: parsed.data.pacienteId,
      entidadTipo: 'paciente',
      rutaDetalle: `/dashboard/pacientes/${parsed.data.pacienteId}`,
      resumen: 'Seguimiento resuelto',
      detalles: {}
    });

    revalidatePath(`/dashboard/pacientes/${parsed.data.pacienteId}`);
  } catch (error) {
    logger.error('Error registrando resolución', error);
    throw new Error('No se pudo registrar la resolución.');
  }
}
