import { useCallback } from 'react';
import { toast } from 'sonner';
import type { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import { captureError } from '@/lib/utils/errorLogging';

type EventPayload = Partial<AgendaEvent> & {
  servicioId?: string | null;
  requiereSeguimiento?: boolean;
};

/**
 * Hook para manejar todas las operaciones CRUD de eventos de agenda
 */
export function useAgendaActions(invalidateAgenda: () => void) {
  // Helper para hacer requests a la API
  const requestAgenda = async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });
    let data: Record<string, unknown> = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok) {
      const message = typeof data.error === 'string' ? data.error : 'Operación de agenda no disponible.';
      throw new Error(message);
    }
    return data;
  };

  // Serializar evento para enviar a la API
  const serializeEventPayload = (data: EventPayload) => {
    const payload: Record<string, unknown> = {};
    if (data.titulo !== undefined) payload.titulo = data.titulo;
    if (data.tipo !== undefined) payload.tipo = data.tipo;
    if (data.estado !== undefined) payload.estado = data.estado;
    if (data.prioridad !== undefined) payload.prioridad = data.prioridad;
    if (data.notas !== undefined) payload.notas = data.notas;
    if (data.requiereSeguimiento !== undefined) payload.requiereSeguimiento = data.requiereSeguimiento;
    if (data.fechaInicio instanceof Date) payload.fechaInicio = data.fechaInicio.toISOString();
    if (data.fechaFin instanceof Date) payload.fechaFin = data.fechaFin.toISOString();
    if (data.profesionalId !== undefined) payload.profesionalId = data.profesionalId || null;
    if (data.pacienteId !== undefined) payload.pacienteId = data.pacienteId || null;
    if (data.salaId !== undefined) payload.salaId = data.salaId || null;
    if (data.servicioId !== undefined) payload.servicioId = data.servicioId || null;
    return payload;
  };

  // Mostrar toast con opción de deshacer
  const showUndoToast = useCallback(
    (message: string, undoAction: () => Promise<void>) => {
      toast.success(message, {
        action: {
          label: 'Deshacer',
          onClick: () => {
            undoAction()
              .then(() => {
                toast.success('Cambio revertido');
              })
              .catch((error) => {
                captureError(error, { module: 'agenda-actions', action: 'undo-change' });
                toast.error('No se pudo deshacer el cambio');
              });
          },
        },
      });
    },
    []
  );

  // Mover evento (drag & drop)
  const handleEventMove = async (
    eventId: string,
    newStart: Date,
    newResourceId: string | undefined,
    eventos: AgendaEvent[]
  ) => {
    try {
      const evento = eventos.find((e) => e.id === eventId);
      if (!evento) return;

      const duration = evento.fechaFin.getTime() - evento.fechaInicio.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      const payload: Record<string, unknown> = {
        fechaInicio: newStart.toISOString(),
        fechaFin: newEnd.toISOString(),
      };

      if (newResourceId && newResourceId !== evento.profesionalId) {
        payload.profesionalId = newResourceId;
      }

      await requestAgenda(`/api/agenda/eventos/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await invalidateAgenda();

      const revertPayload: Record<string, unknown> = {
        fechaInicio: evento.fechaInicio.toISOString(),
        fechaFin: evento.fechaFin.toISOString(),
      };
      if (evento.profesionalId !== undefined) {
        revertPayload.profesionalId = evento.profesionalId || null;
      }
      showUndoToast('Evento actualizado', async () => {
        await requestAgenda(`/api/agenda/eventos/${eventId}`, {
          method: 'PATCH',
          body: JSON.stringify(revertPayload),
        });
        await invalidateAgenda();
      });
    } catch (error) {
      captureError(error, { module: 'agenda-actions', action: 'move-event', metadata: { eventId } });
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el evento');
    }
  };

  // Redimensionar evento
  const handleEventResize = async (
    eventId: string,
    newDurationMinutes: number,
    eventos: AgendaEvent[]
  ) => {
    try {
      const evento = eventos.find((e) => e.id === eventId);
      if (!evento) return;

      const newEnd = new Date(evento.fechaInicio.getTime() + newDurationMinutes * 60000);
      await requestAgenda(`/api/agenda/eventos/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ fechaFin: newEnd.toISOString() }),
      });
      await invalidateAgenda();
      showUndoToast('Duración actualizada', async () => {
        await requestAgenda(`/api/agenda/eventos/${eventId}`, {
          method: 'PATCH',
          body: JSON.stringify({ fechaFin: evento.fechaFin.toISOString() }),
        });
        await invalidateAgenda();
      });
    } catch (error) {
      captureError(error, { module: 'agenda-actions', action: 'resize-event', metadata: { eventId } });
      toast.error(error instanceof Error ? error.message : 'Error al actualizar duración');
    }
  };

  // Reasignar profesional
  const handleReassignProfessional = async (evento: AgendaEvent, profesionalId: string) => {
    try {
      await requestAgenda(`/api/agenda/eventos/${evento.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ profesionalId: profesionalId || null }),
      });
      await invalidateAgenda();
      toast.success('Profesional actualizado');
    } catch (error) {
      captureError(error, {
        module: 'agenda-actions',
        action: 'reassign-professional',
        metadata: { eventId: evento.id, profesionalId },
      });
      toast.error('No se pudo reasignar la cita');
    }
  };

  // Actualización inline (desde drawer)
  const handleInlineUpdate = async (eventId: string, updates: Partial<AgendaEvent>) => {
    try {
      const payload = serializeEventPayload(updates as EventPayload);
      await requestAgenda(`/api/agenda/eventos/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await invalidateAgenda();
      toast.success('Cita actualizada');
    } catch (error) {
      captureError(error, { module: 'agenda-actions', action: 'inline-update', metadata: { eventId } });
      toast.error('No se pudo actualizar la cita');
    }
  };

  // Acción rápida (confirmar, completar, cancelar)
  const handleQuickAction = async (
    evento: AgendaEvent,
    action: 'confirm' | 'complete' | 'cancel'
  ) => {
    try {
      const nuevoEstado =
        action === 'confirm' ? 'confirmada' : action === 'complete' ? 'realizada' : 'cancelada';
      const estadoAnterior = evento.estado;

      await requestAgenda(`/api/agenda/eventos/${evento.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: nuevoEstado,
          __quickAction: action,
          __eventoTitulo: evento.titulo,
          __pacienteNombre: evento.pacienteNombre ?? null,
          __profesionalNombre: evento.profesionalNombre ?? null,
        }),
      });
      await invalidateAgenda();

      const mensajes = {
        confirm: 'Cita confirmada',
        complete: 'Cita completada',
        cancel: 'Cita cancelada',
      } as const;

      showUndoToast(mensajes[action], async () => {
        await requestAgenda(`/api/agenda/eventos/${evento.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ estado: estadoAnterior }),
        });
        await invalidateAgenda();
      });
    } catch (error) {
      captureError(error, {
        module: 'agenda-actions',
        action: 'quick-action',
        metadata: { eventId: evento.id, action },
      });
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    }
  };

  // Guardar evento (crear o editar)
  const handleSaveEvent = async (
    eventData: Partial<AgendaEvent>,
    eventToEdit: AgendaEvent | null,
    onSuccess: (profesionalId?: string, fechaInicio?: Date) => void
  ) => {
    try {
      if (!eventData.fechaInicio || !eventData.fechaFin) {
        toast.error('Faltan datos de fecha para la cita');
        return;
      }

      const payload = serializeEventPayload(eventData as EventPayload);

      const eventoFechaInicio =
        eventData.fechaInicio instanceof Date ? eventData.fechaInicio : eventToEdit?.fechaInicio;
      const eventoProfesionalId =
        typeof eventData.profesionalId === 'string'
          ? eventData.profesionalId
          : eventToEdit?.profesionalId;

      if (eventToEdit) {
        await requestAgenda(`/api/agenda/eventos/${eventToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Cita actualizada');
      } else {
        const titulo = payload.titulo as string | undefined;
        const profesionalId = payload.profesionalId as string | undefined;
        const fechaInicioIso = payload.fechaInicio as string | undefined;
        const fechaFinIso = payload.fechaFin as string | undefined;

        if (!titulo || !profesionalId || !fechaInicioIso || !fechaFinIso) {
          toast.error('Completa título, profesional y horario de la cita.');
          return;
        }

        payload.estado = (eventData.estado as AgendaEvent['estado']) ?? 'programada';

        await requestAgenda('/api/agenda/eventos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Cita creada');
      }

      await invalidateAgenda();
      onSuccess(eventoProfesionalId, eventoFechaInicio);
    } catch (error) {
      captureError(error, {
        module: 'agenda-actions',
        action: 'save-event',
        metadata: { isEdit: !!eventToEdit },
      });
      toast.error(error instanceof Error ? error.message : 'Error al guardar la cita');
      throw error;
    }
  };

  return {
    handleEventMove,
    handleEventResize,
    handleReassignProfessional,
    handleInlineUpdate,
    handleQuickAction,
    handleSaveEvent,
  };
}
