import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { updatePaciente, deletePaciente } from '@/lib/server/pacientesAdmin';

const ALLOWED_ROLES = new Set(['admin', 'coordinacion']);

async function ensureAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const hasRole = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasRole) {
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
    await updatePaciente(id, body, { email: user.email ?? undefined, uid: user.uid });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /no existe/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    await deletePaciente(id, { email: user.email ?? undefined, uid: user.uid });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /no existe/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
