import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { updateTratamiento, deleteTratamiento } from '@/lib/server/tratamientos';

const WRITE_ROLES = new Set(['admin', 'coordinacion']);

const servicioIncluidoSchema = z.object({
  servicioId: z.string().min(1),
  servicioNombre: z.string().min(1),
  orden: z.number().int().min(1),
  opcional: z.boolean(),
});

const tratamientoUpdateSchema = z.object({
  nombre: z.string().min(1).max(150).optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  categoria: z.enum(['medicina', 'fisioterapia', 'enfermeria', 'mixto']).optional(),
  serviciosIncluidos: z.array(servicioIncluidoSchema).min(1).optional(),
  activo: z.boolean().optional(),
});

const ensureUser = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const hasAccess = (user.roles ?? []).some((role) => WRITE_ROLES.has(role));
  if (!hasAccess) {
    return { error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }
  return { user };
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureUser();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = tratamientoUpdateSchema.parse(body);
    const payload = {
      ...parsed,
      descripcion: parsed.descripcion ?? undefined,
    };
    await updateTratamiento(id, payload, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/tratamientos] Error en PATCH', error);
    const status = error instanceof z.ZodError ? 400 : /no existe/i.test(String(error)) ? 404 : 500;
    const message =
      error instanceof z.ZodError
        ? error.flatten()
        : error instanceof Error
        ? error.message
        : 'Error inesperado';
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureUser();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    await deleteTratamiento(id, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/tratamientos] Error en DELETE', error);
    const status = /no existe/i.test(String(error)) ? 404 : 500;
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status });
  }
}
