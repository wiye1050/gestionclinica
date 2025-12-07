import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { updateCatalogoServicio, deleteCatalogoServicio } from '@/lib/server/catalogoServicios';

const limiter = rateLimit(RATE_LIMIT_STRICT);


async function ensureAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return { error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

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
