import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createAgendaEvent } from '@/lib/server/agendaEvents';

const ALLOWED_ROLES = new Set(['admin', 'coordinacion', 'operador']);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body.titulo || !body.fechaInicio || !body.fechaFin || !body.profesionalId) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios: título, fechas y profesional son requeridos.' },
        { status: 400 }
      );
    }

    const result = await createAgendaEvent({
      titulo: String(body.titulo),
      tipo: body.tipo ?? 'consulta',
      pacienteId: body.pacienteId || null,
      profesionalId: String(body.profesionalId),
      salaId: body.salaId || null,
      servicioId: body.servicioId || null,
      fechaInicio: String(body.fechaInicio),
      fechaFin: String(body.fechaFin),
      estado: body.estado ?? 'programada',
      prioridad: body.prioridad ?? 'media',
      notas: body.notas ?? '',
      requiereSeguimiento: Boolean(body.requiereSeguimiento),
      creadoPorId: user.uid,
      creadoPor: user.email ?? 'desconocido',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
