'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { createEventoAgendaSchema, updateEventoAgendaSchema } from '@/lib/validators';
import { createAgendaEvent, updateAgendaEvent, deleteAgendaEvent } from '@/lib/server/agendaEvents';
import { captureError } from '@/lib/utils/errorLogging';

/**
 * Server Actions para el módulo de Agenda
 */

export async function createEventoAgendaAction(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const validation = createEventoAgendaSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten(),
      };
    }

    const result = await createAgendaEvent({
      ...validation.data,
      pacienteId: validation.data.pacienteId || null,
      salaId: validation.data.salaId || null,
      servicioId: validation.data.servicioId || null,
      creadoPorId: user.uid,
      creadoPor: user.email ?? 'desconocido',
    });

    revalidatePath('/dashboard/agenda');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'createEventoAgenda' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function updateEventoAgendaAction(data: unknown) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const validation = updateEventoAgendaSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Datos inválidos',
        errors: validation.error.flatten(),
      };
    }

    const { id, ...changes } = validation.data;

    const result = await updateAgendaEvent(id, changes, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/agenda');

    return { success: true, data: result };
  } catch (error) {
    captureError(error, { module: "actions", action: 'updateEventoAgenda' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}

export async function deleteEventoAgendaAction(eventoId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    if (!eventoId || typeof eventoId !== 'string') {
      return { success: false, error: 'ID de evento inválido' };
    }

    await deleteAgendaEvent(eventoId, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidatePath('/dashboard/agenda');

    return { success: true };
  } catch (error) {
    captureError(error, { module: "actions", action: 'deleteEventoAgenda' });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado',
    };
  }
}
