"use server";

import { revalidatePath } from 'next/cache';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createMejoraSchema, updateMejoraEstadoSchema, addEvidenciaSchema } from '@/lib/validators/mejoras';
import { logAudit } from '@/lib/utils/audit';
import { getCurrentUser } from '@/lib/auth/server';

type ActionState = { success: boolean; error: string | null };

const calcularScore = (data: { reach: number; impact: number; confidence: number; effort: number }) => {
  const { reach, impact, confidence, effort } = data;
  if (effort <= 0) return 0;
  return Math.round(((reach * impact * confidence) / effort) * 100) / 100;
};

export async function crearMejoraAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'No autenticado' };

  const parsed = createMejoraSchema.safeParse({
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    area: formData.get('area'),
    responsableUid: formData.get('responsableUid')?.toString() || undefined,
    responsableNombre: formData.get('responsableNombre')?.toString() || undefined,
    reach: formData.get('reach'),
    impact: formData.get('impact'),
    confidence: formData.get('confidence'),
    effort: formData.get('effort'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join('. ')
    };
  }

  const { reach, impact, confidence, effort, ...rest } = parsed.data;
  const score = calcularScore({ reach, impact, confidence, effort });

  try {
    const docRef = await addDoc(collection(db, 'mejoras'), {
      ...rest,
      estado: 'idea',
      rice: { reach, impact, confidence, effort, score },
      evidenciasCount: 0,
      creadoPor: user.uid,
      creadoPorNombre: user.displayName ?? user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await logAudit({
      actorUid: user.uid,
      actorNombre: user.displayName ?? user.email,
      modulo: 'mejoras',
      accion: 'crear-mejora',
      entidadId: docRef.id,
      entidadTipo: 'mejora',
      rutaDetalle: `/dashboard/mejoras/${docRef.id}`,
      resumen: rest.titulo,
      detalles: { titulo: rest.titulo, area: rest.area }
    });

    revalidatePath('/dashboard/mejoras');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creando mejora', error);
    return { success: false, error: 'No se pudo crear la mejora.' };
  }
}

export async function actualizarEstadoMejoraAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('No autenticado');

  const parsed = updateMejoraEstadoSchema.parse({
    mejoraId: formData.get('mejoraId'),
    estado: formData.get('estado')
  });

  await updateDoc(doc(db, 'mejoras', parsed.mejoraId), {
    estado: parsed.estado,
    updatedAt: serverTimestamp()
  });

  await logAudit({
    actorUid: user.uid,
    actorNombre: user.displayName ?? user.email,
    modulo: 'mejoras',
    accion: 'actualizar-estado',
    entidadId: parsed.mejoraId,
    entidadTipo: 'mejora',
    rutaDetalle: `/dashboard/mejoras/${parsed.mejoraId}`,
    resumen: `Estado: ${parsed.estado}`,
    detalles: { estado: parsed.estado }
  });

  revalidatePath(`/dashboard/mejoras/${parsed.mejoraId}`);
}

export async function agregarEvidenciaAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('No autenticado');

  const parsed = addEvidenciaSchema.parse({
    mejoraId: formData.get('mejoraId'),
    tipo: formData.get('tipo'),
    url: formData.get('url')?.toString(),
    descripcion: formData.get('descripcion')?.toString()
  });

  await addDoc(collection(db, 'mejoras-evidencias'), {
    ...parsed,
    autorUid: user.uid,
    autorNombre: user.displayName ?? user.email,
    createdAt: serverTimestamp()
  });

  await logAudit({
    actorUid: user.uid,
    actorNombre: user.displayName ?? user.email,
    modulo: 'mejoras',
    accion: 'agregar-evidencia',
    entidadId: parsed.mejoraId,
    entidadTipo: 'mejora',
    rutaDetalle: `/dashboard/mejoras/${parsed.mejoraId}`,
    resumen: `Evidencia ${parsed.tipo}`,
    detalles: { tipo: parsed.tipo }
  });

  revalidatePath(`/dashboard/mejoras/${parsed.mejoraId}`);
}
