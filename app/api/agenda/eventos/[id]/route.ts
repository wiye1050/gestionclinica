import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { deleteAgendaEvent, updateAgendaEvent } from '@/lib/server/agendaEvents';
import { checkEventConflicts, validateEventDates } from '@/lib/server/agendaValidation';
import { adminDb } from '@/lib/firebaseAdmin';
import { logAuditServer } from '@/lib/utils/auditServer';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { updateEventoAgendaSchema } from '@/lib/validators';

const limiter = rateLimit(RATE_LIMIT_STRICT);


async function ensureAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return { error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No se enviaron cambios.' }, { status: 400 });
    }
    const {
      __quickAction,
      __eventoTitulo,
      __pacienteNombre,
      __profesionalNombre,
      ...updates
    } = body satisfies Record<string, unknown>;

    // Validar updates con Zod (omitiendo el campo 'id' que viene de params)
    const updateSchemaWithoutId = updateEventoAgendaSchema.omit({ id: true }).partial();
    const validation = updateSchemaWithoutId.safeParse(updates);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Validar fechas si se están actualizando
    if (updates.fechaInicio && updates.fechaFin) {
      const fechaInicio = new Date(updates.fechaInicio as string);
      const fechaFin = new Date(updates.fechaFin as string);
      const dateError = validateEventDates(fechaInicio, fechaFin);
      if (dateError) {
        return NextResponse.json({ error: dateError }, { status: 400 });
      }
    }

    // Validar conflictos si se actualizan fechas, profesional o sala
    if (updates.fechaInicio || updates.profesionalId || updates.salaId) {
      // Obtener evento actual para tener todos los datos
      let currentEvent;
      if (adminDb) {
        const doc = await adminDb.collection('agenda-eventos').doc(id).get();
        if (!doc.exists) {
          return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
        }
        currentEvent = doc.data();
      }

      // Si hay datos actuales, validar conflictos
      if (currentEvent) {
        const fechaInicio = updates.fechaInicio
          ? new Date(updates.fechaInicio as string)
          : currentEvent.fechaInicio?.toDate();
        const fechaFin = updates.fechaFin
          ? new Date(updates.fechaFin as string)
          : currentEvent.fechaFin?.toDate();
        const profesionalId =
          updates.profesionalId !== undefined
            ? (updates.profesionalId as string | null)
            : currentEvent.profesionalId;
        const salaId =
          updates.salaId !== undefined
            ? (updates.salaId as string | null)
            : currentEvent.salaId;

        if (fechaInicio && fechaFin && (profesionalId || salaId)) {
          const conflict = await checkEventConflicts({
            id, // Excluir evento actual
            fechaInicio,
            fechaFin,
            profesionalId,
            salaId,
          });

          if (conflict && conflict.severity === 'error') {
            return NextResponse.json(
              {
                error: 'Conflicto de horario detectado',
                details: {
                  message:
                    conflict.conflictType === 'double-booking-profesional'
                      ? `El profesional ya tiene una cita en ese horario: "${conflict.conflictingEventTitulo}"`
                      : `La sala ya está ocupada en ese horario: "${conflict.conflictingEventTitulo}"`,
                  conflictType: conflict.conflictType,
                  conflictingEventId: conflict.conflictingEventId,
                },
              },
              { status: 409 }
            );
          }
        }
      }
    }

    await updateAgendaEvent(id, updates, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    if (__quickAction && typeof __quickAction === 'string') {
      const estadoDestino =
        typeof updates.estado === 'string' ? (updates.estado as string) : undefined;
      await logAuditServer({
        actorUid: user.uid,
        actorNombre: user.email ?? 'Usuario',
        modulo: 'agenda',
        accion: `quick-action-${__quickAction}`,
        entidadId: id,
        entidadTipo: 'agenda-evento',
        resumen: `${__quickAction} ${__eventoTitulo ?? 'cita'}`,
        detalles: {
          paciente: __pacienteNombre ?? null,
          profesional: __profesionalNombre ?? null,
          estadoDestino,
        },
      });

      if (adminDb) {
        await adminDb.collection('notificaciones').add({
          tipo: 'agenda',
          prioridad: __quickAction === 'cancel' ? 'alta' : 'media',
          titulo: `Cita ${__quickAction === 'cancel' ? 'cancelada' : 'actualizada'}`,
          mensaje: `${__eventoTitulo ?? 'Cita sin título'} ${
            estadoDestino ? `→ ${estadoDestino}` : ''
          }${__pacienteNombre ? ` · ${__pacienteNombre}` : ''}`,
          entidadId: id,
          entidadTipo: 'agenda-evento',
          destinatarioUid: user.uid,
          url: '/dashboard/agenda',
          leida: false,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = error instanceof Error && /no existe/i.test(error.message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    await deleteAgendaEvent(id, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = error instanceof Error && /no existe/i.test(error.message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
