'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { createProfesionalSchema, updateProfesionalSchema } from '@/lib/validators';
import { createProfesional, updateProfesional, deleteProfesional } from '@/lib/server/profesionales';
import { captureError } from '@/lib/utils/errorLogging';

/**
 * Server Actions para el módulo de Profesionales
 */

export async function createProfesionalAction(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const validation = createProfesionalSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten(),
      };
    }

    const result = await createProfesional(validation.data, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/profesionales');
    revalidateTag('profesionales');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'createProfesional' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function updateProfesionalAction(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const validation = updateProfesionalSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten(),
      };
    }

    // Extraer id (asumiendo que está en los datos)
    const { id, ...changes } = validation.data as { id?: string };

    if (!id) {
      return { success: false, error: 'ID de profesional requerido' };
    }

    const result = await updateProfesional(id, changes, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/profesionales');
    revalidateTag('profesionales');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'updateProfesional' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function deleteProfesionalAction(profesionalId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    if (!profesionalId || typeof profesionalId !== 'string') {
      return { success: false, error: 'ID de profesional inválido' };
    }

    await deleteProfesional(profesionalId, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/profesionales');
    revalidateTag('profesionales');

    return { success: true };
  } catch (error) {
    captureError(error, { module: "actions", action: 'deleteProfesional' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}
