import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getInventarioSnapshot } from '@/lib/server/inventario';

const ALLOWED_ROLES = new Set(['admin', 'coordinacion', 'operador', 'doctor', 'terapeuta']);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 200;

  try {
    const snapshot = await getInventarioSnapshot(limit);
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    console.error('[api/inventario] Error en GET', error);
    const message = error instanceof Error ? error.message : 'No se pudo cargar el inventario';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
