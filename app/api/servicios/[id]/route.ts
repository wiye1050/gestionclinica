import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { deleteServicioAsignado, updateServicioAsignado } from '@/lib/server/servicios';

const ALLOWED_ROLES = new Set(['admin', 'coordinador']);

const ensureAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
    return { error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }
  return { user };
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    const body = await request.json();
    const changes: Record<string, unknown> = {};

    if (body.esActual !== undefined) changes.esActual = Boolean(body.esActual);
    if (body.tiquet !== undefined) changes.tiquet = String(body.tiquet);
    if (body.profesionalPrincipalId !== undefined)
      changes.profesionalPrincipalId = body.profesionalPrincipalId as string;
    if (body.profesionalSegundaOpcionId !== undefined)
      changes.profesionalSegundaOpcionId = body.profesionalSegundaOpcionId as string | null;
    if (body.profesionalTerceraOpcionId !== undefined)
      changes.profesionalTerceraOpcionId = body.profesionalTerceraOpcionId as string | null;

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No se enviaron cambios.' }, { status: 400 });
    }

    await updateServicioAsignado(id, changes, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = error instanceof Error && error.name === 'NotFoundError' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    await deleteServicioAsignado(id, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = error instanceof Error && error.name === 'NotFoundError' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
