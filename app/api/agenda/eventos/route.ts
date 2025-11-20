import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { createAgendaEvent } from '@/lib/server/agendaEvents';
import { validateRequest } from '@/lib/utils/apiValidation';

const ALLOWED_ROLES = new Set(['admin', 'coordinacion', 'operador']);

// Schema de validación para crear evento
const createEventSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200, 'Título muy largo'),
  tipo: z.enum(['consulta', 'seguimiento', 'revision', 'tratamiento', 'urgencia', 'administrativo']).default('consulta'),
  pacienteId: z.string().nullable().optional(),
  profesionalId: z.string().min(1, 'El profesional es requerido'),
  salaId: z.string().nullable().optional(),
  servicioId: z.string().nullable().optional(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
  estado: z.enum(['programada', 'confirmada', 'realizada', 'cancelada']).default('programada'),
  prioridad: z.enum(['alta', 'media', 'baja']).default('media'),
  notas: z.string().max(1000, 'Notas muy largas').default(''),
  requiereSeguimiento: z.boolean().default(false),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  // Validar request con Zod
  const validation = await validateRequest(request, createEventSchema);
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
