import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { createAgendaEvent } from '@/lib/server/agendaEvents';
import { validateRequest } from '@/lib/utils/apiValidation';
import { createEventoAgendaSchema } from '@/lib/validators';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

const limiter = rateLimit(RATE_LIMIT_STRICT);

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

    const result = await createAgendaEvent({
      titulo: data.titulo,
      tipo: data.tipo,
      pacienteId: data.pacienteId || null,
      profesionalId: data.profesionalId,
      salaId: data.salaId || null,
      servicioId: data.servicioId || null,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
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
