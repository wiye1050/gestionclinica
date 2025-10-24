"use server";

import { z } from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth/server';
import { logAudit } from '@/lib/utils/audit';
import { revalidatePath } from 'next/cache';

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
    await addDoc(collection(db, 'pacientes-historial'), {
      pacienteId: parsed.data.pacienteId,
      fecha: serverTimestamp(),
      tipo: 'seguimiento',
      descripcion: 'Seguimiento resuelto por coordinación.',
      resultado: 'Seguimiento completado',
      planesSeguimiento: null,
      creadoPor: user.uid,
      createdAt: serverTimestamp()
    });

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
    console.error('Error registrando resolución', error);
    throw new Error('No se pudo registrar la resolución.');
  }
}
