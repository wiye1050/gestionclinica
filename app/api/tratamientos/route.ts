import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createTratamiento, getSerializedTratamientos, getSerializedCatalogoServicios } from '@/lib/server/tratamientos';

const ALLOWED_ROLES = new Set(['admin', 'coordinador']);
const VIEW_ROLES = new Set(['admin', 'coordinador', 'profesional']);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const hasAccess = (user.roles ?? []).some((role) => VIEW_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const [tratamientos, catalogo] = await Promise.all([
      getSerializedTratamientos(),
      getSerializedCatalogoServicios(),
    ]);
    return NextResponse.json({ tratamientos, catalogo });
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
    const result = await createTratamiento(body, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
