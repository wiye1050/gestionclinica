import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import {
  createTratamiento,
  getSerializedTratamientos,
  type TratamientoInput,
} from '@/lib/server/tratamientos';

const READ_ROLES = new Set(['admin', 'coordinacion', 'operador', 'doctor', 'terapeuta']);
const WRITE_ROLES = new Set(['admin', 'coordinacion']);

const servicioIncluidoSchema = z.object({
  servicioId: z.string().min(1),
  servicioNombre: z.string().min(1),
  orden: z.number().int().min(1),
  opcional: z.boolean(),
});

const tratamientoSchema = z.object({
  nombre: z.string().min(1).max(150),
  descripcion: z.string().max(2000).optional(),
  categoria: z.enum(['medicina', 'fisioterapia', 'enfermeria', 'mixto']),
  serviciosIncluidos: z.array(servicioIncluidoSchema).min(1),
  activo: z.boolean(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const hasAccess = (user.roles ?? []).some((role) => READ_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const tratamientos = await getSerializedTratamientos();
    return NextResponse.json(tratamientos, { status: 200 });
  } catch (error) {
    console.error('[api/tratamientos] Error en GET', error);
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los tratamientos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const hasAccess = (user.roles ?? []).some((role) => WRITE_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = tratamientoSchema.parse(body) as TratamientoInput;
    const result = await createTratamiento(parsed, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[api/tratamientos] Error en POST', error);
    const status = error instanceof z.ZodError ? 400 : 500;
    const message =
      error instanceof z.ZodError
        ? error.flatten()
        : error instanceof Error
        ? error.message
        : 'Error inesperado';
    return NextResponse.json({ error: message }, { status });
  }
}
