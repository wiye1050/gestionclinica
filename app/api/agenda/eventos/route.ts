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
 * @async
 * @param {NextRequest} request - Request de Next.js
 *
 * @query {string} weekStart - Fecha ISO de inicio de semana (requerido)
 *
 * @returns {Promise<NextResponse>} Eventos de la semana
 * @returns {200} Éxito - { events: AgendaEvento[] }
 * @returns {400} weekStart faltante o inválido
 * @returns {401} No autenticado
 * @returns {403} Permisos insuficientes
 * @returns {500} Error del servidor
 *
 * @security Requiere autenticación
 * @security Requiere rol de lectura: admin | coordinador | profesional | recepcion
 *
 * @example
 * // Obtener eventos de la semana del 18 de marzo
 * GET /api/agenda/eventos?weekStart=2024-03-18T00:00:00.000Z
 *
 * @example
 * // Respuesta exitosa
 * {
 *   "events": [
 *     {
 *       "id": "evt-123",
 *       "titulo": "Consulta Juan Pérez",
 *       "tipo": "consulta",
 *       "fechaInicio": "2024-03-18T10:00:00.000Z",
 *       "fechaFin": "2024-03-18T11:00:00.000Z",
 *       "profesionalId": "prof-1",
 *       "pacienteId": "pac-1",
 *       "estado": "programada"
 *     }
 *   ]
 * }
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

/**
 * POST /api/agenda/eventos
 * Crea un nuevo evento en la agenda con validación de conflictos
 *
 * @async
 * @param {NextRequest} request - Request de Next.js con body JSON
 *
 * @body {string} titulo - Título del evento (requerido, máx 200 caracteres)
 * @body {string} tipo - Tipo: 'consulta' | 'seguimiento' | 'revision' | 'tratamiento' | 'urgencia' | 'administrativo'
 * @body {string} [pacienteId] - ID del paciente (opcional)
 * @body {string} profesionalId - ID del profesional asignado (requerido)
 * @body {string} [salaId] - ID de la sala (opcional)
 * @body {string} [servicioId] - ID del servicio asociado (opcional)
 * @body {string} fechaInicio - Fecha/hora de inicio ISO (requerido)
 * @body {string} fechaFin - Fecha/hora de fin ISO (requerido)
 * @body {string} [estado='programada'] - Estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada'
 * @body {string} [prioridad='media'] - Prioridad: 'alta' | 'media' | 'baja'
 * @body {string} [notas] - Notas adicionales (máx 1000 caracteres)
 * @body {boolean} [requiereSeguimiento=false] - Si requiere seguimiento posterior
 *
 * @returns {Promise<NextResponse>} Evento creado
 * @returns {201} Éxito - { id: string, ...eventoData }
 * @returns {400} Datos inválidos o fechas incorrectas
 * @returns {401} No autenticado
 * @returns {403} Permisos insuficientes (requiere rol de escritura)
 * @returns {409} Conflicto de horario (double-booking)
 * @returns {500} Error del servidor
 *
 * @security Requiere autenticación
 * @security Requiere rol: admin | coordinador | profesional | recepcion
 *
 * @validation Valida que fechaFin > fechaInicio
 * @validation Detecta conflictos de horario para profesional y sala
 *
 * @example
 * // Crear consulta básica
 * POST /api/agenda/eventos
 * {
 *   "titulo": "Consulta Dr. García",
 *   "tipo": "consulta",
 *   "profesionalId": "prof-123",
 *   "pacienteId": "pac-456",
 *   "fechaInicio": "2024-03-20T10:00:00.000Z",
 *   "fechaFin": "2024-03-20T11:00:00.000Z",
 *   "estado": "programada",
 *   "prioridad": "media"
 * }
 *
 * @example
 * // Error de conflicto (409)
 * {
 *   "error": "Conflicto de horario detectado",
 *   "details": {
 *     "message": "El profesional ya tiene una cita en ese horario: 'Consulta anterior'",
 *     "conflictType": "double-booking-profesional",
 *     "conflictingEventId": "evt-789"
 *   }
 * }
 *
 * @throws {ZodError} Si los datos no pasan la validación del schema
 */
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
