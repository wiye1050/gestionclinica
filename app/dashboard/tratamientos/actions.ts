'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { createTratamientoSchema } from '@/lib/validators';
import { createTratamiento, updateTratamiento, deleteTratamiento } from '@/lib/server/tratamientos';
import { captureError } from '@/lib/utils/errorLogging';

/**
 * Server Actions para el módulo de Tratamientos
 */

export async function createTratamientoAction(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const validation = createTratamientoSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten(),
      };
    }

    const result = await createTratamiento(validation.data, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/tratamientos');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'createTratamiento' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function updateTratamientoAction(tratamientoId: string, data: Record<string, unknown>) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    if (!tratamientoId || typeof tratamientoId !== 'string') {
      return { success: false, error: 'ID de tratamiento inválido' };
    }

    const result = await updateTratamiento(tratamientoId, data, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/tratamientos');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'updateTratamiento' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function deleteTratamientoAction(tratamientoId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    if (!tratamientoId || typeof tratamientoId !== 'string') {
      return { success: false, error: 'ID de tratamiento inválido' };
    }

    await deleteTratamiento(tratamientoId, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/tratamientos');

    return { success: true };
  } catch (error) {
    captureError(error, { module: "actions", action: 'deleteTratamiento' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}
