import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { updateCatalogoServicio, deleteCatalogoServicio } from '@/lib/server/catalogoServicios';

const ALLOWED_ROLES = new Set(['admin', 'coordinacion']);

async function ensureAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
    return { error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    const body = await request.json();
    await updateCatalogoServicio(id, body, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /existe/.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    await deleteCatalogoServicio(id, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /existe/.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
