"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { createProtocolo, createVersion, registerLectura } from '@/lib/server/protocolos';
import { createProtocolSchema, createProtocolVersionSchema } from '@/lib/validators/protocols';
import { logAudit } from '@/lib/utils/audit';

type ActionState = { success: boolean; error: string | null };

export async function createProtocolAction(prevState: ActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !user.roles?.includes('coordinacion') && !user.roles?.includes('admin')) {
    return { success: false, error: 'No tienes permisos para crear protocolos.' };
  }

  const values = {
    titulo: formData.get('titulo'),
    area: formData.get('area'),
    descripcion: formData.get('descripcion')?.toString(),
    requiereQuiz: formData.get('requiereQuiz') === 'on',
    visiblePara: formData.getAll('visiblePara')
  };

  console.log('Valores del formulario:', values);

  const parsed = createProtocolSchema.safeParse(values);
  if (!parsed.success) {
    console.error('Error de validación:', parsed.error);
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('. ')
    };
  }

  const payload = parsed.data;

  try {
    const result = await createProtocolo(payload, { uid: user.uid, email: user.email });

    await logAudit({
      actorUid: user.uid,
      actorNombre: user.displayName ?? user.email,
      modulo: 'protocolos',
      accion: 'crear-protocolo',
      entidadId: result.id,
      entidadTipo: 'protocolo',
      rutaDetalle: `/dashboard/protocolos/${result.id}`,
      resumen: payload.titulo,
      detalles: { titulo: payload.titulo, area: payload.area }
    });

    revalidatePath('/dashboard/protocolos');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creando protocolo', error);
    return { success: false, error: 'No se pudo crear el protocolo.' };
  }
}

const lecturaSchema = z.object({
  protocoloId: z.string().min(1),
  version: z.coerce.number().min(1),
  checklistConfirmada: z.coerce.boolean()
});

export async function registerReadingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No autenticado');
  }

  const parsed = lecturaSchema.parse({
    protocoloId: formData.get('protocoloId'),
    version: formData.get('version'),
    checklistConfirmada: formData.get('checklistConfirmada')
  });


  await registerLectura(parsed.protocoloId, {
    version: parsed.version,
    checklistConfirmada: parsed.checklistConfirmada,
  }, { uid: user.uid, email: user.email });

  await logAudit({
    actorUid: user.uid,
    actorNombre: user.displayName ?? user.email,
    modulo: 'protocolos',
    accion: 'registrar-lectura',
    entidadId: parsed.protocoloId,
    entidadTipo: 'protocolo',
    rutaDetalle: `/dashboard/protocolos/${parsed.protocoloId}`,
    resumen: `Lectura v${parsed.version}`,
    detalles: { version: parsed.version }
  });

  revalidatePath(`/dashboard/protocolos/${parsed.protocoloId}`);
}

export async function createProtocolVersionAction(prevState: ActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (!user.roles?.includes('admin') && !user.roles?.includes('coordinacion'))) {
    return { success: false, error: 'No tienes permisos para crear versiones.' };
  }

  const values = {
    protocoloId: formData.get('protocoloId'),
    contenido: formData.get('contenido')?.toString(),
    checklist: [],
    guionComunicacion: formData.get('guionComunicacion')?.toString(),
    anexos: [],
    quiz: undefined
  };

  const parsed = createProtocolVersionSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('. ')
    };
  }

  try {
    const result = await createVersion(parsed.data.protocoloId, parsed.data.contenido, {
      uid: user.uid,
      email: user.email,
    });

    await logAudit({
      actorUid: user.uid,
      actorNombre: user.displayName ?? user.email,
      modulo: 'protocolos',
      accion: 'crear-version',
      entidadId: parsed.data.protocoloId,
      entidadTipo: 'protocolo-version',
      rutaDetalle: `/dashboard/protocolos/${parsed.data.protocoloId}`,
      resumen: `Versión v${result.version}`,
      detalles: {}
    });

    revalidatePath(`/dashboard/protocolos/${parsed.data.protocoloId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creando versión', error);
    return { success: false, error: 'No se pudo crear la versión.' };
  }
}
