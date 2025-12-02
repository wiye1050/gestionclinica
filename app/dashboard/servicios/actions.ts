'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { createServicioSchema, updateServicioSchema } from '@/lib/validators';
import { createServicioAsignado, updateServicioAsignado, deleteServicioAsignado } from '@/lib/server/servicios';
import { captureError } from '@/lib/utils/errorLogging';

/**
 * Server Actions para el módulo de Servicios Asignados
 */

export async function createServicioAction(data: unknown) {
  try {
    // Autenticación
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    // Validación con Zod
    const validation = createServicioSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten(),
      };
    }

    // Crear servicio
    const result = await createServicioAsignado({
      catalogoServicioId: validation.data.catalogoServicioId,
      grupoId: validation.data.grupoId,
      tiquet: validation.data.tiquet,
      profesionalPrincipalId: validation.data.profesionalPrincipalId,
      profesionalSegundaOpcionId: validation.data.profesionalSegundaOpcionId || null,
      profesionalTerceraOpcionId: validation.data.profesionalTerceraOpcionId || null,
      requiereApoyo: validation.data.requiereApoyo,
      sala: validation.data.sala ?? '',
      supervision: validation.data.supervision,
      esActual: validation.data.esActual,
      creadoPor: user.email ?? 'desconocido',
      creadoPorId: user.uid,
    });

    // Revalidar la página de servicios
    revalidatePath('/dashboard/servicios');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'createServicio' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function updateServicioAction(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const validation = updateServicioSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten(),
      };
    }

    const { id, ...changes } = validation.data;

    const result = await updateServicioAsignado(id, changes, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/servicios');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'updateServicio' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function deleteServicioAction(servicioId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    if (!servicioId || typeof servicioId !== 'string') {
      return { success: false, error: 'ID de servicio inválido' };
    }

    await deleteServicioAsignado(servicioId, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/servicios');

    return { success: true };
  } catch (error) {
    captureError(error, { module: "actions", action: 'deleteServicio' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}
