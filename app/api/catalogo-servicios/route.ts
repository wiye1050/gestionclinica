import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createCatalogoServicio, getSerializedCatalogoServicios } from '@/lib/server/catalogoServicios';

const ALLOWED_ROLES = new Set(['admin', 'coordinador']);
const VIEW_ROLES = new Set(['admin', 'coordinador', 'profesional']);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const canView = (user.roles ?? []).some((role) => VIEW_ROLES.has(role));
  if (!canView) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const servicios = await getSerializedCatalogoServicios();
    return NextResponse.json({ servicios });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const result = await createCatalogoServicio(body, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
