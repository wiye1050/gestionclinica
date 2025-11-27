import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getServerKPIs } from '@/lib/server/kpis';

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
    const data = await getServerKPIs();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
