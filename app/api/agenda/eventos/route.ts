import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { createAgendaEvent } from '@/lib/server/agendaEvents';
import { getSerializedAgendaEvents } from '@/lib/server/agenda';
import { checkEventConflicts, validateEventDates } from '@/lib/server/agendaValidation';
import { validateRequest } from '@/lib/utils/apiValidation';
import { createEventoAgendaSchema } from '@/lib/validators';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';

const limiter = rateLimit(RATE_LIMIT_STRICT);

/**
 * GET /api/agenda/eventos
 * Obtiene eventos de agenda para una semana específica
 *
 * Query params:
 * - weekStart: ISO string de la fecha de inicio de semana
 *
 * @security Requiere autenticación y rol de lectura
 */
export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  // Verificar autenticación
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar autorización
  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const weekStartParam = searchParams.get('weekStart');

    if (!weekStartParam) {
      return NextResponse.json(
        { error: 'Parámetro weekStart requerido' },
        { status: 400 }
      );
    }

    const weekStart = new Date(weekStartParam);

    if (isNaN(weekStart.getTime())) {
      return NextResponse.json(
        { error: 'Fecha weekStart inválida' },
        { status: 400 }
      );
    }

    const events = await getSerializedAgendaEvents(weekStart);

    return NextResponse.json({ events });
  } catch (error) {
    logger.error('[API /api/agenda/eventos GET] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  // Validar request con Zod
  const validation = await validateRequest(request, createEventoAgendaSchema);
  if (!validation.success) {
    return validation.error;
  }

  try {
    const data = validation.data;

    // Convertir fechas de string a Date
    const fechaInicio = new Date(data.fechaInicio);
    const fechaFin = new Date(data.fechaFin);

    // Validar fechas
    const dateError = validateEventDates(fechaInicio, fechaFin);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    // Validar conflictos (solo si hay profesional o sala asignados)
    if (data.profesionalId || data.salaId) {
      const conflict = await checkEventConflicts({
        fechaInicio,
        fechaFin,
        profesionalId: data.profesionalId || null,
        salaId: data.salaId || null,
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

    const result = await createAgendaEvent({
      titulo: data.titulo,
      tipo: data.tipo,
      pacienteId: data.pacienteId || null,
      profesionalId: data.profesionalId,
      salaId: data.salaId || null,
      servicioId: data.servicioId || null,
      fechaInicio: data.fechaInicio, // string (la función convierte internamente)
      fechaFin: data.fechaFin, // string (la función convierte internamente)
      estado: data.estado,
      prioridad: data.prioridad,
      notas: data.notas,
      requiereSeguimiento: data.requiereSeguimiento,
      creadoPorId: user.uid,
      creadoPor: user.email ?? 'desconocido',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
