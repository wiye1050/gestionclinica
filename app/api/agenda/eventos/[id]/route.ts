import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { deleteAgendaEvent, updateAgendaEvent } from '@/lib/server/agendaEvents';
import { adminDb } from '@/lib/firebaseAdmin';
import { logAuditServer } from '@/lib/utils/auditServer';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

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
